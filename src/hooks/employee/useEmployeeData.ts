
import { useEffect } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { DemoUserService } from '@/services/demoUserService';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();
  
  const demoService = DemoUserService.getInstance();
  const queryKey = ['employees', isDemoMode, selectedDepartmentId] as const;

  const fetchEmployeesFn = async (): Promise<Employee[]> => {
    console.log(`[useEmployeeData] Starting employee fetch from ${isDemoMode ? 'demo' : 'public'} schema...`);

    if (isDemoMode) {
      const { data, error: rpcError } = await rpcWithRefresh('get_demo_profiles_admin_detailed', {
        full_access: true
      });

      if (rpcError) {
        console.error('[useEmployeeData] Demo RPC error:', rpcError);
        throw new Error(`Demo profiles fetch failed: ${rpcError.message}`);
      }

      if (!data || data.length === 0) {
        console.log('[useEmployeeData] No demo profiles found');
        return [];
      }

      console.log(`[useEmployeeData] Found ${data.length} demo profiles`);

      const transformedEmployees: Employee[] = data.map((profile: any) => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: (profile.role || 'servicemedarbejder') as Employee['role'],
        onLeave: profile.on_leave || false,
        status: profile.status || 'active',
        notes: profile.notes || '',
        avatar_url: profile.avatar_url,
        has_asbestos_certificate: !!profile.has_asbestos_certificate,
        has_trailer_license: !!profile.has_trailer_license,
        has_drivers_license: !!profile.has_drivers_license,
        has_forklift_license: !!profile.has_forklift_license
      }));

      // Merge with locally stored demo employees
      const localDemoEmployees = demoService.getDemoEmployees();
      const localConverted: Employee[] = localDemoEmployees.map((profile: any) => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: (profile.role || 'servicemedarbejder') as Employee['role'],
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
      return merged;
    } else {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, name, email, phone, job_title, on_leave, status, notes, avatar_url,
          is_temporary, expires_at, has_asbestos_certificate, has_trailer_license,
          has_drivers_license, has_forklift_license, home_department_id
        `)
        .order('name', { ascending: true });

      if (profilesError) throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      if (!profiles || profiles.length === 0) return [];

      console.log(`[useEmployeeData] Found ${profiles.length} profiles`);

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) console.error('[useEmployeeData] User roles fetch error:', rolesError);

      const rolesMap = new Map<string, string>();
      if (userRoles && Array.isArray(userRoles)) {
        userRoles.forEach((userRole: any) => rolesMap.set(userRole.user_id, userRole.role));
      }

      const transformedEmployees: Employee[] = profiles.map((profile: any) => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: (rolesMap.get(profile.id) || 'servicemedarbejder') as Employee['role'],
        onLeave: profile.on_leave || false,
        status: profile.status || 'active',
        notes: profile.notes || '',
        avatar_url: profile.avatar_url,
        is_temporary: profile.is_temporary || false,
        expires_at: profile.expires_at,
        has_asbestos_certificate: !!profile.has_asbestos_certificate,
        has_trailer_license: !!profile.has_trailer_license,
        has_forklift_license: !!profile.has_forklift_license
      }));

      // Filter by department
      let departmentFilteredEmployees = transformedEmployees;
      if (selectedDepartmentId && !isDemoMode) {
        const { data: accessData, error: accessError } = await supabase
          .from('user_access')
          .select('user_id')
          .eq('department_id', selectedDepartmentId);

        if (accessError) console.error('[useEmployeeData] user_access fetch error:', accessError);

        const departmentUserIds = new Set((accessData || []).map(a => a.user_id));

        departmentFilteredEmployees = transformedEmployees.filter(emp => {
          if (departmentUserIds.has(emp.id)) return true;
          const empRole = rolesMap.get(emp.id);
          if (empRole === 'super_admin') {
            const profile = profiles.find((p: any) => p.id === emp.id);
            return profile?.home_department_id === selectedDepartmentId;
          }
          return false;
        });
      }

      // Filter out demo user from production view
      let finalEmployees = departmentFilteredEmployees;
      if (!isDemoMode) {
        finalEmployees = departmentFilteredEmployees.filter(emp =>
          emp.email !== 'test@polygongroup.com' &&
          emp.id !== '165cdbc9-6722-4c96-97d2-1a87185c8133'
        );
      }

      console.log('[useEmployeeData] Employee data set successfully, count:', finalEmployees.length);
      return finalEmployees;
    }
  };

  const { data: employees = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: fetchEmployeesFn,
    enabled: userDataLoaded && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Show error toasts
  useEffect(() => {
    if (!queryError) return;
    const errorMessage = queryError instanceof Error ? queryError.message : 'Failed to fetch employees';
    if (!errorMessage.includes('logged in') && !errorMessage.includes('Authentication required') && !isDemoMode) {
      toast({ title: t('common.error') || 'Error', description: t('employees.fetchError') || 'Error loading employees', variant: 'destructive' });
    }
  }, [queryError]);

  // Realtime subscription
  useEffect(() => {
    if (!userDataLoaded || !user || isDemoMode) return;

    let timeoutId: NodeJS.Timeout;

    const channel = supabase
      .channel(`employee_changes_public`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log(`[useEmployeeData] Profile change detected:`, payload.eventType);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }, 1000);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
        console.log(`[useEmployeeData] Role change detected:`, payload.eventType);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }, 1000);
      })
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [isDemoMode, userDataLoaded, user, queryClient]);

  return {
    employees,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch employees') : null,
    fetchEmployees: async () => { await refetch(); }
  };
};
