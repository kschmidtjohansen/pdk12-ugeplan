
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { DemoUserService } from '@/services/demoUserService';
import { useAuth } from '@/context/AuthContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
// DemoUserFiltering removed - schema isolation handles data separation

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasShownError, setHasShownError] = useState(false);
  
  const demoService = DemoUserService.getInstance();

  // FIXED: Now that RLS policy is corrected, we can fetch normally
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useEmployeeData] Starting employee fetch from ${isDemoMode ? 'demo' : 'public'} schema...`);
      
      if (isDemoMode) {
        // Use demo RPC for demo users
        const { data, error: rpcError } = await rpcWithRefresh('get_demo_profiles_admin_detailed', {
          full_access: true  // Demo users should see unmasked data in their isolated environment
        });

        if (rpcError) {
          console.error('[useEmployeeData] Demo RPC error:', rpcError);
          throw new Error(`Demo profiles fetch failed: ${rpcError.message}`);
        }

        if (!data || data.length === 0) {
          console.log('[useEmployeeData] No demo profiles found');
          setEmployees([]);
          return;
        }

        console.log(`[useEmployeeData] Found ${data.length} demo profiles`);

        // Transform data with proper type casting
        const transformedEmployees: Employee[] = data.map((profile: any) => ({
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: profile.role as 'administrator' | 'skadeleder' | 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          status: profile.status || 'active',
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        }));

        const administrators = transformedEmployees.filter(emp => emp.role === 'administrator');
        const skadeledere = transformedEmployees.filter(emp => emp.role === 'skadeleder');

        console.log('[useEmployeeData] Demo distribution:');
        console.log('- Administrators:', administrators.length);
        console.log('- Skadeledere:', skadeledere.length);
        console.log('- Total employees:', transformedEmployees.length);

        // Merge with locally stored demo employees
        const localDemoEmployees = demoService.getDemoEmployees();
        const localConverted: Employee[] = localDemoEmployees.map((profile: any) => ({
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: profile.role as 'administrator' | 'skadeleder' | 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          status: profile.status || 'active',
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        }));

        const merged = [...transformedEmployees, ...localConverted];
        console.log(`[useEmployeeData] Merged ${transformedEmployees.length} baseline + ${localConverted.length} local demo employees`);

        // Only update state if data actually changed to prevent stutter
        setEmployees(prev => {
          if (prev.length === merged.length && 
              prev.slice(0, 3).every((e, i) => e.id === merged[i]?.id)) {
            return prev; // No change, keep previous reference
          }
          return merged;
        });
        console.log('[useEmployeeData] Demo employee data set successfully');
      } else {
        // Fetch profiles with proper error handling
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });

        if (profilesError) {
          console.error('[useEmployeeData] Profiles fetch error:', profilesError);
          throw new Error(`Profiles fetch failed: ${profilesError.message}`);
        }

        if (!profiles || profiles.length === 0) {
          console.log('[useEmployeeData] No profiles found');
          setEmployees([]);
          return;
        }

        console.log(`[useEmployeeData] Found ${profiles.length} profiles`);

        // Fetch user roles from same schema
        const { data: userRoles, error: rolesError } = await supabase
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

        // Schema isolation handles data separation - no filtering needed
        const administrators = transformedEmployees.filter(emp => emp.role === 'administrator');
        const skadeledere = transformedEmployees.filter(emp => emp.role === 'skadeleder');

        console.log('[useEmployeeData] Final distribution:');
        console.log('- Administrators:', administrators.length);
        console.log('- Skadeledere:', skadeledere.length);
        console.log('- Total employees:', transformedEmployees.length);

        // Only update state if data actually changed to prevent stutter
        setEmployees(prev => {
          if (prev.length === transformedEmployees.length && 
              prev.slice(0, 3).every((e, i) => e.id === transformedEmployees[i]?.id)) {
            return prev; // No change, keep previous reference
          }
          return transformedEmployees;
        });
        console.log('[useEmployeeData] Employee data set successfully');
      }
    } catch (err) {
      console.error('[useEmployeeData] ❌ ERROR fetching employees:', err);
      console.error('[useEmployeeData] ❌ ERROR DETAILS', {
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined,
        isDemoMode,
        userDataLoaded,
        userId: user?.id,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      
      // Suppress auth errors during initial auth flow and for demo users
      if (!hasShownError && !errorMessage.includes('logged in') && !errorMessage.includes('Authentication required') && !isDemoMode) {
        toast({
          title: t('common.error') || 'Error',
          description: t('employees.fetchError') || 'Error loading employees',
          variant: 'destructive',
        });
        setHasShownError(true);
      }
      
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t, isDemoMode, hasShownError]);

  // Load employees on mount - wait for userDataLoaded to stabilize
  useEffect(() => {
    if (!userDataLoaded || !user) return;
    
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [userDataLoaded, user?.id]);

  // Realtime subscription with proper debouncing and schema awareness
  useEffect(() => {
    if (!userDataLoaded || !user) return;
    
    if (isDemoMode) {
      console.log('[useEmployeeData] Demo mode: polling disabled (data is static)');
      return;
    } else {
      // Production mode: Use realtime subscriptions
      console.log(`[useEmployeeData] Setting up realtime subscription for public schema...`);
      
      let timeoutId: NodeJS.Timeout;
      
      const channel = supabase
        .channel(`employee_changes_public`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          console.log(`[useEmployeeData] Profile change detected in public:`, payload.eventType);
          
          // Debounce updates to prevent rapid-fire refetches
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchEmployees();
          }, 1000);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
          console.log(`[useEmployeeData] Role change detected in public:`, payload.eventType);
          
          // Debounce updates to prevent rapid-fire refetches
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchEmployees();
          }, 1000);
        })
        .subscribe((status) => {
          console.log(`[useEmployeeData] Subscription status for public:`, status);
        });
        
      return () => {
        console.log(`[useEmployeeData] Cleaning up realtime subscription for public`);
        clearTimeout(timeoutId);
        supabase.removeChannel(channel);
      };
    }
  }, [isDemoMode, userDataLoaded, user]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
