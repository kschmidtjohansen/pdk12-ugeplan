
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { DemoUserService } from '@/services/demoUserService';
import { useAuth } from '@/context/AuthContext';
import { DemoUserFiltering } from '@/utils/demoUserFiltering';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const demoService = DemoUserService.getInstance();
  const client = getSchemaClient(isDemoMode);

  // FIXED: Now that RLS policy is corrected, we can fetch normally
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useEmployeeData] Starting employee fetch from ${isDemoMode ? 'demo' : 'public'} schema...`);
      
      // Fetch profiles with proper error handling using schema-aware client
      const { data: profiles, error: profilesError } = await client
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (profilesError) {
        console.error('[useEmployeeData] FIXED - Profiles fetch error:', profilesError);
        throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('[useEmployeeData] FIXED - No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] Found ${profiles.length} profiles`);
      
      // Fetch user roles from same schema
      const { data: userRoles, error: rolesError } = await client
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error('[useEmployeeData] User roles fetch error:', rolesError);
        // Don't throw here, use default roles
      } else {
        console.log(`[useEmployeeData] Successfully fetched ${userRoles?.length || 0} user roles`);
      }
      
      // Create role mapping
      const rolesMap = new Map<string, string>();
      if (userRoles && Array.isArray(userRoles)) {
        userRoles.forEach((userRole: any) => {
          rolesMap.set(userRole.user_id, userRole.role);
        });
      }
      
      console.log(`[useEmployeeData] Role mapping created for ${rolesMap.size} users`);
      
      // Transform data with proper type casting
      const transformedEmployees: Employee[] = profiles.map((profile: any) => {
        const role = rolesMap.get(profile.id) || 'servicemedarbejder';
        
        const employee: Employee = {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: role as 'administrator' | 'skadeleder' | 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          status: profile.status || 'active',
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        };
        
        return employee;
      });
      
      // DEMO USER FILTERING: Use centralized filtering utility
      const filteredEmployees = DemoUserFiltering.filterEmployees(transformedEmployees, user?.email);
      console.log(`[useEmployeeData] Applied demo user filtering. Showing ${filteredEmployees.length} of ${transformedEmployees.length} employees`);
      
      const administrators = filteredEmployees.filter(emp => emp.role === 'administrator');
      const skadeledere = filteredEmployees.filter(emp => emp.role === 'skadeleder');
      
      console.log('[useEmployeeData] FIXED - Final distribution (after demo filtering):');
      console.log('- Administrators:', administrators.length);
      console.log('- Skadeledere:', skadeledere.length);
      console.log('- Total employees:', filteredEmployees.length);
      
      setEmployees(filteredEmployees);
      console.log('[useEmployeeData] FIXED - Employee data set successfully');
      
    } catch (err) {
      console.error('[useEmployeeData] FIXED - Error:', err);
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

  // Realtime subscription with proper debouncing and schema awareness
  useEffect(() => {
    const schema = isDemoMode ? 'demo' : 'public';
    console.log(`[useEmployeeData] Setting up realtime subscription for ${schema} schema...`);
    
    let timeoutId: NodeJS.Timeout;
    
    const channel = supabase
      .channel(`employee_changes_${schema}`)
      .on('postgres_changes', { event: '*', schema: schema, table: 'profiles' }, (payload) => {
        console.log(`[useEmployeeData] Profile change detected in ${schema}:`, payload.eventType);
        
        // Debounce updates to prevent rapid-fire refetches
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchEmployees();
        }, 1000);
      })
      .on('postgres_changes', { event: '*', schema: schema, table: 'user_roles' }, (payload) => {
        console.log(`[useEmployeeData] Role change detected in ${schema}:`, payload.eventType);
        
        // Debounce updates to prevent rapid-fire refetches
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchEmployees();
        }, 1000);
      })
      .subscribe((status) => {
        console.log(`[useEmployeeData] Subscription status for ${schema}:`, status);
      });
      
    return () => {
      console.log(`[useEmployeeData] Cleaning up realtime subscription for ${schema}`);
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchEmployees, isDemoMode]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
