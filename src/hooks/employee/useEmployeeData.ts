
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';

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
      
      console.log('[useEmployeeData] Starting employee fetch...');
      
      // Step 1: Ensure we have a valid authenticated session
      const sessionValid = await ensureValidSession();
      if (!sessionValid) {
        throw new Error('Authentication session is invalid or expired');
      }
      
      console.log('[useEmployeeData] Session validated, fetching profiles...');
      
      // Step 2: Fetch all profiles with enhanced error handling
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
        throw new Error(`Failed to fetch employee profiles: ${profilesError.message}`);
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('[useEmployeeData] No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] Fetched ${profilesData.length} profiles`);
      
      // Step 3: Fetch user roles with improved error handling
      const userIds = profilesData.map(profile => profile.id);
      
      console.log('[useEmployeeData] Fetching user roles...');
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
        
      if (rolesError) {
        console.error('[useEmployeeData] Roles query error:', rolesError);
        // Continue with default roles instead of failing completely
        console.warn('[useEmployeeData] Continuing with default roles');
      }
      
      console.log(`[useEmployeeData] Fetched ${rolesData?.length || 0} role assignments`);
      
      // Step 4: Transform data to Employee format
      const transformedEmployees: Employee[] = profilesData.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        
        return {
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
      });
      
      console.log(`[useEmployeeData] Successfully transformed ${transformedEmployees.length} employees`);
      setEmployees(transformedEmployees);
      
    } catch (err) {
      console.error('[useEmployeeData] Error in fetchEmployees:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('Authentication') || errorMessage.includes('session')) {
        toast({
          title: t('common.error') || 'Error',
          description: t('auth.sessionExpired') || 'Session expired - please refresh the page',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error') || 'Error',
          description: t('employees.fetchError') || 'Error loading employees',
          variant: 'destructive',
        });
      }
      
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Set up realtime subscription for profile changes
  useEffect(() => {
    console.log('[useEmployeeData] Setting up realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useEmployeeData] Realtime refresh triggered');
        fetchEmployees();
      }, 1000);
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
        console.log('[useEmployeeData] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useEmployeeData] Cleaning up realtime subscription');
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
