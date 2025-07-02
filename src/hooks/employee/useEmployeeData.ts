
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

  // SIMPLIFIED: Single fetch attempt without retry loops
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmployeeData] SIMPLIFIED - Starting employee fetch...');
      
      // Single query attempt - no retries to prevent loops
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (profilesError) {
        console.error('[useEmployeeData] SIMPLIFIED - Profiles fetch error:', profilesError);
        throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('[useEmployeeData] SIMPLIFIED - No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] SIMPLIFIED - Found ${profiles.length} profiles`);
      
      // Single user roles fetch - no retries
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.warn('[useEmployeeData] SIMPLIFIED - User roles fetch failed, using defaults:', rolesError);
      }
      
      // Create role mapping
      const rolesMap = new Map<string, string>();
      userRoles?.forEach(userRole => {
        rolesMap.set(userRole.user_id, userRole.role);
      });
      
      console.log(`[useEmployeeData] SIMPLIFIED - Role mapping created for ${rolesMap.size} users`);
      
      // Transform data
      const transformedEmployees: Employee[] = profiles.map(profile => {
        const role = rolesMap.get(profile.id) || 'servicemedarbejder';
        
        const employee: Employee = {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: role as 'administrator' | 'skadeleder' | 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        };
        
        return employee;
      });
      
      const administrators = transformedEmployees.filter(emp => emp.role === 'administrator');
      const skadeledere = transformedEmployees.filter(emp => emp.role === 'skadeleder');
      
      console.log('[useEmployeeData] SIMPLIFIED - Final distribution:');
      console.log('- Administrators:', administrators.length);
      console.log('- Skadeledere:', skadeledere.length);
      console.log('- Total employees:', transformedEmployees.length);
      
      setEmployees(transformedEmployees);
      console.log('[useEmployeeData] SIMPLIFIED - Employee data set successfully');
      
    } catch (err) {
      console.error('[useEmployeeData] SIMPLIFIED - Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      
      toast({
        title: t('common.error') || 'Error',
        description: t('employees.fetchError') || 'Error loading employees',
        variant: 'destructive',
      });
      
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // SIMPLIFIED: Single realtime subscription with debouncing
  useEffect(() => {
    console.log('[useEmployeeData] SIMPLIFIED - Setting up realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    
    const channel = supabase
      .channel('employee_changes_simple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('[useEmployeeData] SIMPLIFIED - Profile change detected:', payload.eventType);
        
        // Debounce updates to prevent rapid-fire refetches
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchEmployees();
        }, 1000);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
        console.log('[useEmployeeData] SIMPLIFIED - Role change detected:', payload.eventType);
        
        // Debounce updates to prevent rapid-fire refetches
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchEmployees();
        }, 1000);
      })
      .subscribe((status) => {
        console.log('[useEmployeeData] SIMPLIFIED - Subscription status:', status);
      });
      
    return () => {
      console.log('[useEmployeeData] SIMPLIFIED - Cleaning up realtime subscription');
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
