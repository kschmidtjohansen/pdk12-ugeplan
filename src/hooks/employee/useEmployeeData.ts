
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { DemoUserService } from '@/services/demoUserService';
import { useAuth, usePermissions } from '@/context/AuthContext';
import { DemoUserFiltering } from '@/utils/demoUserFiltering';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const demoService = DemoUserService.getInstance();
  const isDemoUser = user ? demoService.isDemoUser(user.email) : false;

  // FIXED: Now that RLS policy is corrected, we can fetch normally
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmployeeData] FIXED - Starting employee fetch with corrected RLS policy...');
      
      // Use enhanced security profile service with masking by default
      // For admin access, we use masked data by default for security
      console.log(`[useEmployeeData] Using SecureProfileService for enhanced security`);
      
      const { SecureProfileService } = await import('@/services/secureProfileService');
      
      // Use masked data by default (no sensitive PII exposed)
      const profiles = await SecureProfileService.getProfiles();
      
      if (!profiles || profiles.length === 0) {
        console.log('[useEmployeeData] No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] Found ${profiles.length} profiles`);
      
      // Now fetch user roles - this should work without infinite recursion
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error('[useEmployeeData] FIXED - User roles fetch error (this should now work):', rolesError);
        // Don't throw here, use default roles
      } else {
        console.log(`[useEmployeeData] FIXED - Successfully fetched ${userRoles?.length || 0} user roles`);
      }
      
      // Create role mapping
      const rolesMap = new Map<string, string>();
      userRoles?.forEach(userRole => {
        rolesMap.set(userRole.user_id, userRole.role);
      });
      
      console.log(`[useEmployeeData] FIXED - Role mapping created for ${rolesMap.size} users`);
      
      // Transform data with enhanced security
      const transformedEmployees: Employee[] = profiles.map(profile => {
        const role = rolesMap.get(profile.id) || 'servicemedarbejder';
        
        const employee: Employee = {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '', // Masked by default for security
          phone: profile.phone || '', // Masked by default for security  
          jobTitle: profile.job_title || '',
          role: role as 'administrator' | 'skadeleder' | 'servicemedarbejder' | 'vikar',
          onLeave: false, // Default value since masked view doesn't expose this
          status: profile.status || 'active',
          notes: '', // Hidden in masked view for security
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

  // FIXED: Realtime subscription with proper debouncing
  useEffect(() => {
    console.log('[useEmployeeData] FIXED - Setting up realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    
    const channel = supabase
      .channel('employee_changes_fixed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('[useEmployeeData] FIXED - Profile change detected:', payload.eventType);
        
        // Debounce updates to prevent rapid-fire refetches
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchEmployees();
        }, 1000);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
        console.log('[useEmployeeData] FIXED - Role change detected:', payload.eventType);
        
        // Debounce updates to prevent rapid-fire refetches
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchEmployees();
        }, 1000);
      })
      .subscribe((status) => {
        console.log('[useEmployeeData] FIXED - Subscription status:', status);
      });
      
    return () => {
      console.log('[useEmployeeData] FIXED - Cleaning up realtime subscription');
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
