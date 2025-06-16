
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabaseOptimized, ensureValidSessionOptimized } from '@/integrations/supabase/clientOptimized';

export const useEmployeeDataOptimized = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmployeeDataOptimized] Starting optimized employee fetch with new RLS policies...');
      
      // Step 1: Ensure we have a valid authenticated session
      const sessionValid = await ensureValidSessionOptimized();
      if (!sessionValid) {
        throw new Error('Authentication session is invalid or expired');
      }
      
      console.log('[useEmployeeDataOptimized] Session validated, fetching profiles...');
      
      // Step 2: Fetch all profiles with the new standardized RLS policies
      const { data: profilesData, error: profilesError } = await supabaseOptimized
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
        console.error('[useEmployeeDataOptimized] Profiles query error:', profilesError);
        throw new Error(`Failed to fetch employee profiles: ${profilesError.message}`);
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('[useEmployeeDataOptimized] No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeDataOptimized] Successfully fetched ${profilesData.length} profiles`);
      
      // Step 3: Fetch user roles with the new standardized RLS policies
      const userIds = profilesData.map(profile => profile.id);
      
      console.log('[useEmployeeDataOptimized] Fetching user roles...');
      
      const { data: rolesData, error: rolesError } = await supabaseOptimized
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
        
      if (rolesError) {
        console.error('[useEmployeeDataOptimized] Roles query error:', rolesError);
        // Continue with default roles instead of failing completely
        console.warn('[useEmployeeDataOptimized] Continuing with default roles due to error:', rolesError.message);
      }
      
      console.log(`[useEmployeeDataOptimized] Successfully fetched ${rolesData?.length || 0} role assignments`);
      
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
      
      console.log(`[useEmployeeDataOptimized] Successfully transformed ${transformedEmployees.length} employees`);
      setEmployees(transformedEmployees);
      
      // Clear any previous errors
      setError(null);
      
    } catch (err) {
      console.error('[useEmployeeDataOptimized] Error in fetchEmployees:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('Authentication') || errorMessage.includes('session')) {
        toast({
          title: t('common.error') || 'Error',
          description: t('auth.sessionExpired') || 'Session expired - please refresh the page',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('row-level security')) {
        toast({
          title: t('employees.rlsErrorTitle') || 'Access Error',
          description: t('employees.rlsErrorDescription') || 'Access error loading employees. Security policies have been updated.',
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

  // Set up optimized realtime subscription for profile changes
  useEffect(() => {
    console.log('[useEmployeeDataOptimized] Setting up optimized realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useEmployeeDataOptimized] Realtime refresh triggered');
        fetchEmployees();
      }, 500); // Reduced debounce time for better responsiveness
    };
    
    const channel = supabaseOptimized
      .channel('profiles_changes_optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('[useEmployeeDataOptimized] Received profile change:', payload.eventType);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('[useEmployeeDataOptimized] Received user role change:', payload.eventType);
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[useEmployeeDataOptimized] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useEmployeeDataOptimized] Cleaning up realtime subscription');
      clearTimeout(timeoutId);
      supabaseOptimized.removeChannel(channel);
    };
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
