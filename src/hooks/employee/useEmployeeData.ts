
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { DemoUserService } from '@/services/demoUserService';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
// DemoUserFiltering removed - schema isolation handles data separation

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const { selectedDepartmentId } = useDepartment();
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
          avatar_url: profile.avatar_url,
          has_asbestos_certificate: !!profile.has_asbestos_certificate,
          has_trailer_license: !!profile.has_trailer_license,
          has_drivers_license: !!profile.has_drivers_license,
          has_forklift_license: !!profile.has_forklift_license
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
          avatar_url: profile.avatar_url,
          has_asbestos_certificate: !!profile.has_asbestos_certificate,
          has_trailer_license: !!profile.has_trailer_license,
          has_drivers_license: !!profile.has_drivers_license,
          has_forklift_license: !!profile.has_forklift_license
        }));

        const merged = [...transformedEmployees, ...localConverted];
        console.log(`[useEmployeeData] Merged ${transformedEmployees.length} baseline + ${localConverted.length} local demo employees`);

        // Deep comparison function to detect meaningful changes
        const haveEmployeesChanged = (prev: Employee[], next: Employee[]) => {
          if (prev.length !== next.length) return true;
          
          return prev.some((prevEmp, i) => {
            const nextEmp = next[i];
            if (!nextEmp || prevEmp.id !== nextEmp.id) return true;
            
            // Check fields that matter for UI updates
            return prevEmp.onLeave !== nextEmp.onLeave ||
                   prevEmp.status !== nextEmp.status ||
                   prevEmp.name !== nextEmp.name ||
                   prevEmp.email !== nextEmp.email ||
                   prevEmp.phone !== nextEmp.phone ||
                   prevEmp.jobTitle !== nextEmp.jobTitle ||
                   prevEmp.role !== nextEmp.role ||
                   prevEmp.notes !== nextEmp.notes ||
                   prevEmp.avatar_url !== nextEmp.avatar_url ||
                   prevEmp.has_asbestos_certificate !== nextEmp.has_asbestos_certificate ||
                   prevEmp.has_trailer_license !== nextEmp.has_trailer_license ||
                   prevEmp.has_forklift_license !== nextEmp.has_forklift_license;
          });
        };

        setEmployees(prev => haveEmployeesChanged(prev, merged) ? merged : prev);
        console.log('[useEmployeeData] Demo employee data set successfully');
      } else {
        // Fetch profiles with proper error handling
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            phone,
            job_title,
            on_leave,
            status,
            notes,
            avatar_url,
            is_temporary,
            expires_at,
            has_asbestos_certificate,
            has_trailer_license,
            has_drivers_license,
            has_forklift_license,
            home_department_id
          `)
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
            avatar_url: profile.avatar_url,
            is_temporary: profile.is_temporary || false,
            expires_at: profile.expires_at,
            has_asbestos_certificate: !!profile.has_asbestos_certificate,
            has_trailer_license: !!profile.has_trailer_license,
            has_forklift_license: !!profile.has_forklift_license
          };

          return employee;
        });

        // Filter by department if selectedDepartmentId is set (demo user sees all departments)
        let departmentFilteredEmployees = transformedEmployees;
        if (selectedDepartmentId && !isDemoMode) {
          // Get user_ids with access to the selected department
          const { data: accessData, error: accessError } = await supabase
            .from('user_access')
            .select('user_id')
            .eq('department_id', selectedDepartmentId);

          if (accessError) {
            console.error('[useEmployeeData] user_access fetch error:', accessError);
          }

          const departmentUserIds = new Set((accessData || []).map(a => a.user_id));

          departmentFilteredEmployees = transformedEmployees.filter(emp => {
            // Include if employee has access to this department
            if (departmentUserIds.has(emp.id)) return true;
            
            // Super Admin exception: include if their home_department_id matches selected department
            const empRole = rolesMap.get(emp.id);
            if (empRole === 'super_admin') {
              const profile = profiles.find((p: any) => p.id === emp.id);
              return profile?.home_department_id === selectedDepartmentId;
            }
            
            return false;
          });

          console.log(`[useEmployeeData] Filtered by department ${selectedDepartmentId}: ${transformedEmployees.length} -> ${departmentFilteredEmployees.length}`);
        }

        // Schema isolation handles data separation - no filtering needed
        const administrators = departmentFilteredEmployees.filter(emp => emp.role === 'administrator');
        const skadeledere = departmentFilteredEmployees.filter(emp => emp.role === 'skadeleder');

        console.log('[useEmployeeData] Final distribution:');
        console.log('- Administrators:', administrators.length);
        console.log('- Skadeledere:', skadeledere.length);
        console.log('- Total employees:', departmentFilteredEmployees.length);

        // Filter out demo user from production view (demo user is only for demo mode)
        let finalEmployees = departmentFilteredEmployees;
        if (!isDemoMode) {
          const beforeCount = departmentFilteredEmployees.length;
          finalEmployees = departmentFilteredEmployees.filter(emp => 
            emp.email !== 'test@polygongroup.com' && 
            emp.id !== '165cdbc9-6722-4c96-97d2-1a87185c8133'
          );
          
          if (beforeCount !== finalEmployees.length) {
            console.log(`[useEmployeeData] Filtered demo user from production view. Total: ${beforeCount} -> ${finalEmployees.length}`);
          }
        }

        // Deep comparison function to detect meaningful changes
        const haveEmployeesChanged = (prev: Employee[], next: Employee[]) => {
          if (prev.length !== next.length) return true;
          
          return prev.some((prevEmp, i) => {
            const nextEmp = next[i];
            if (!nextEmp || prevEmp.id !== nextEmp.id) return true;
            
            // Check fields that matter for UI updates
            return prevEmp.onLeave !== nextEmp.onLeave ||
                   prevEmp.status !== nextEmp.status ||
                   prevEmp.name !== nextEmp.name ||
                   prevEmp.email !== nextEmp.email ||
                   prevEmp.phone !== nextEmp.phone ||
                   prevEmp.jobTitle !== nextEmp.jobTitle ||
                   prevEmp.role !== nextEmp.role ||
                   prevEmp.notes !== nextEmp.notes ||
                   prevEmp.avatar_url !== nextEmp.avatar_url ||
                   prevEmp.has_asbestos_certificate !== nextEmp.has_asbestos_certificate ||
                   prevEmp.has_trailer_license !== nextEmp.has_trailer_license ||
                   prevEmp.has_forklift_license !== nextEmp.has_forklift_license;
          });
        };

        setEmployees(prev => haveEmployeesChanged(prev, finalEmployees) ? finalEmployees : prev);
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
  }, [toast, t, isDemoMode, hasShownError, selectedDepartmentId]);

  // Load employees on mount - wait for userDataLoaded to stabilize
  useEffect(() => {
    if (!userDataLoaded || !user) return;
    
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [userDataLoaded, user?.id, selectedDepartmentId]);

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
