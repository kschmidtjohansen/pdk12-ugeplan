
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmployeeData] Fetching employees with improved error handling...');
      
      // First, verify we have a valid session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session) {
        throw new Error('Authentication required to load employees');
      }
      
      console.log('[useEmployeeData] Session verified, fetching profiles...');
      
      // Fetch all profiles with better error handling including avatar_url
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes,
          avatar_url,
          created_at,
          updated_at
        `)
        .order('name', { ascending: true });
      
      if (profilesError) {
        console.error('[useEmployeeData] Profiles query error:', profilesError);
        
        // Handle specific RLS errors more gracefully
        if (profilesError.message.includes('row-level security')) {
          throw new Error('Access denied - please ensure you are logged in with proper permissions');
        }
        throw new Error(`Failed to fetch employee profiles: ${profilesError.message}`);
      }
      
      if (!profilesData) {
        console.log('[useEmployeeData] No profiles data returned');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] Fetched ${profilesData.length} profiles`);
      
      // Fetch user roles with improved error handling
      const userIds = profilesData.map(profile => profile.id);
      
      if (userIds.length === 0) {
        console.log('[useEmployeeData] No user IDs to fetch roles for');
        setEmployees([]);
        return;
      }
      
      console.log('[useEmployeeData] Fetching user roles...');
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
        
      if (rolesError) {
        console.warn('[useEmployeeData] Roles query error:', rolesError);
        // Don't throw here, just log and continue with default roles
        console.warn('[useEmployeeData] Continuing with default roles due to error:', rolesError.message);
      }
      
      console.log(`[useEmployeeData] Fetched ${rolesData?.length || 0} role assignments`);
      
      // Transform data to Employee format with better error handling
      const transformedEmployees: Employee[] = profilesData.map(profile => {
        try {
          const userRole = rolesData?.find(r => r.user_id === profile.id);
          
          const employee: Employee = {
            id: profile.id,
            name: profile.name || 'Unknown',
            email: profile.email || '',
            phone: profile.phone || '',
            jobTitle: profile.job_title || '',
            role: userRole?.role || 'servicemedarbejder',
            onLeave: profile.on_leave || false,
            notes: profile.notes || '',
            avatar_url: profile.avatar_url
          };
          
          console.log(`[useEmployeeData] Transformed employee: ${employee.name} (${employee.role})`);
          
          return employee;
        } catch (transformError) {
          console.error(`[useEmployeeData] Error transforming profile ${profile.id}:`, transformError);
          // Return a safe default employee
          return {
            id: profile.id,
            name: profile.name || 'Unknown',
            email: profile.email || '',
            phone: '',
            jobTitle: '',
            role: 'servicemedarbejder',
            onLeave: false,
            notes: '',
            avatar_url: profile.avatar_url
          } as Employee;
        }
      });
      
      console.log(`[useEmployeeData] Successfully transformed ${transformedEmployees.length} employees`);
      setEmployees(transformedEmployees);
      
    } catch (err) {
      console.error('[useEmployeeData] Error in fetchEmployees:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Show user-friendly error message with better error handling
      try {
        if (errorMessage.includes('Authentication required') || errorMessage.includes('Access denied')) {
          toast({
            title: t('common.error') || 'Error',
            description: t('auth.sessionExpired') || 'Session expired - please log in again',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('row-level security')) {
          toast({
            title: t('common.error') || 'Error',
            description: 'Access error - insufficient permissions',
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('common.error') || 'Error',
            description: t('employees.fetchError') || 'Error loading employees',
            variant: 'destructive',
          });
        }
      } catch (toastError) {
        console.error('[useEmployeeData] Error showing toast:', toastError);
        // Fallback toast without translation
        toast({
          title: 'Error',
          description: 'Failed to load employees',
          variant: 'destructive',
        });
      }
      
      // Set empty array on error to prevent undefined issues
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Set up realtime subscription for profile changes with debouncing
  useEffect(() => {
    console.log('[useEmployeeData] Setting up realtime subscription for profiles...');
    
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useEmployeeData] Debounced refresh triggered');
        fetchEmployees();
      }, 1000); // Wait 1 second before refreshing
    };
    
    const channel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('[useEmployeeData] Received profile change:', payload.eventType);
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[useEmployeeData] Profiles realtime subscription status:', status);
      });

    return () => {
      console.log('[useEmployeeData] Cleaning up profiles realtime subscription');
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
