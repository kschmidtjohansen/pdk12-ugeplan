
import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
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
      
      // Fetch all profiles with better error handling
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
          created_at,
          updated_at
        `)
        .order('name', { ascending: true });
      
      if (profilesError) {
        console.error('[useEmployeeData] Profiles query error:', profilesError);
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
        console.error('[useEmployeeData] Roles query error:', rolesError);
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
            createdAt: new Date(profile.created_at),
            updatedAt: new Date(profile.updated_at)
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
            createdAt: new Date(),
            updatedAt: new Date()
          } as Employee;
        }
      });
      
      console.log(`[useEmployeeData] Successfully transformed ${transformedEmployees.length} employees`);
      setEmployees(transformedEmployees);
      
    } catch (err) {
      console.error('[useEmployeeData] Error in fetchEmployees:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('Authentication required')) {
        toast({
          title: t('common.error'),
          description: t('auth.sessionExpired'),
          variant: 'destructive',
        });
      } else if (errorMessage.includes('infinite recursion')) {
        toast({
          title: t('common.error'),
          description: t('employees.rlsError'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('employees.fetchError'),
          variant: 'destructive',
        });
      }
      
      // Set empty array on error to prevent undefined issues
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Set up realtime subscription for profile changes
  useEffect(() => {
    console.log('[useEmployeeData] Setting up realtime subscription for profiles...');
    
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
          
          // Refresh employee data when profiles change
          fetchEmployees();
        }
      )
      .subscribe((status) => {
        console.log('[useEmployeeData] Profiles realtime subscription status:', status);
      });

    return () => {
      console.log('[useEmployeeData] Cleaning up profiles realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
