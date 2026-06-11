
import { useEffect, useRef } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToTables } from '@/lib/realtimeChannels';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoNonHomeDepartment } from '@/constants/demo';
import { fetchPostnrCoords } from '@/hooks/useDawaPostnrLookup';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();
  const backfillRanRef = useRef(false);
  
  const queryKey = ['employees', isDemoMode, selectedDepartmentId] as const;

  const fetchEmployeesFn = async (): Promise<Employee[]> => {
    if (import.meta.env.DEV) console.log(`[useEmployeeData] Starting employee fetch from ${isDemoMode ? 'demo' : 'public'} schema...`);

    if (isDemoMode) {
      if (isDemoNonHomeDepartment(isDemoMode, selectedDepartmentId)) {
        if (import.meta.env.DEV) console.log('[useEmployeeData] Non-home department selected in demo mode, returning empty');
        return [];
      }

      const { data, error: rpcError } = await rpcWithRefresh('get_demo_profiles_admin_detailed', {
        full_access: true
      });

      if (rpcError) {
        if (import.meta.env.DEV) console.error('[useEmployeeData] Demo RPC error:', rpcError);
        throw new Error(`Demo profiles fetch failed: ${rpcError.message}`);
      }

      if (!data || data.length === 0) {
        if (import.meta.env.DEV) console.log('[useEmployeeData] No demo profiles found');
        return [];
      }

      if (import.meta.env.DEV) console.log(`[useEmployeeData] Found ${data.length} demo profiles`);

      // RLS handles data isolation — no local merge needed
      const transformedEmployees: Employee[] = data.map((profile: any) => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: (profile.role || 'servicemedarbejder') as Employee['role'],
        roles: [(profile.role || 'servicemedarbejder') as NonNullable<Employee['roles']>[number]],
        onLeave: profile.on_leave || false,
        status: profile.status || 'active',
        notes: profile.notes || '',
        avatar_url: profile.avatar_url,
        has_asbestos_certificate: !!profile.has_asbestos_certificate,
        has_pcb_certificate: !!profile.has_pcb_certificate,
        has_trailer_license: !!profile.has_trailer_license,
        has_drivers_license: !!profile.has_drivers_license,
        has_forklift_license: !!profile.has_forklift_license,
        home_postcode: profile.home_postcode || '',
        home_address: profile.home_address || '',
        lat: profile.lat ?? undefined,
        lng: profile.lng ?? undefined,
      }));

      if (import.meta.env.DEV) console.log(`[useEmployeeData] Returning ${transformedEmployees.length} demo employees (DB only, no local merge)`);
      return transformedEmployees;
    } else {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, name, email, phone, job_title, on_leave, status, notes, avatar_url,
          is_temporary, expires_at, has_asbestos_certificate, has_pcb_certificate, has_trailer_license,
          has_drivers_license, has_forklift_license, home_department_id, home_postcode, home_address, lat, lng
        `)
        .eq('is_demo', false)
        .order('name', { ascending: true });

      if (profilesError) throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      if (!profiles || profiles.length === 0) return [];

      if (import.meta.env.DEV) console.log(`[useEmployeeData] Found ${profiles.length} profiles`);

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError && import.meta.env.DEV) console.error('[useEmployeeData] User roles fetch error:', rolesError);

      const rolesMap = new Map<string, string[]>();
      if (userRoles && Array.isArray(userRoles)) {
        userRoles.forEach((userRole: any) => {
          const arr = rolesMap.get(userRole.user_id) || [];
          if (!arr.includes(userRole.role)) arr.push(userRole.role);
          rolesMap.set(userRole.user_id, arr);
        });
      }

      const { getEffectiveRole } = await import('@/utils/roleHierarchy');

      const transformedEmployees: Employee[] = profiles.map((profile: any) => {
        const roles = rolesMap.get(profile.id) || [];
        const effective = roles.length
          ? getEffectiveRole(roles as any)
          : 'servicemedarbejder';
        return {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: effective as Employee['role'],
          roles: (roles.length ? roles : [effective]) as Employee['roles'],
          onLeave: profile.on_leave || false,
          status: profile.status || 'active',
          notes: profile.notes || '',
          avatar_url: profile.avatar_url,
          is_temporary: profile.is_temporary || false,
          expires_at: profile.expires_at,
          has_asbestos_certificate: !!profile.has_asbestos_certificate,
          has_pcb_certificate: !!profile.has_pcb_certificate,
          has_trailer_license: !!profile.has_trailer_license,
          has_forklift_license: !!profile.has_forklift_license,
          home_postcode: profile.home_postcode || '',
          home_address: profile.home_address || '',
          lat: profile.lat ?? undefined,
          lng: profile.lng ?? undefined,
        };
      });

      // Filter by department
      let departmentFilteredEmployees = transformedEmployees;
      if (selectedDepartmentId && !isDemoMode) {
        const { data: accessData, error: accessError } = await supabase
          .from('user_access')
          .select('user_id')
          .eq('department_id', selectedDepartmentId);

        if (accessError && import.meta.env.DEV) console.error('[useEmployeeData] user_access fetch error:', accessError);

        const departmentUserIds = new Set((accessData || []).map(a => a.user_id));

        departmentFilteredEmployees = transformedEmployees.filter(emp => {
          if (departmentUserIds.has(emp.id)) return true;
          const empRoles = rolesMap.get(emp.id) || [];
          if (empRoles.includes('super_admin')) {
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

      if (import.meta.env.DEV) console.log('[useEmployeeData] Employee data set successfully, count:', finalEmployees.length);
      return finalEmployees;
    }
  };

  const { data: employees = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: fetchEmployeesFn,
    enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
    staleTime: 5 * 60 * 1000,
  });

  // Backfill missing GPS coordinates for employees with home_postcode
  useEffect(() => {
    if (backfillRanRef.current || isDemoMode || employees.length === 0) return;
    const missing = employees.filter(e => e.home_postcode && !e.lat && !e.lng);
    if (missing.length === 0) return;
    backfillRanRef.current = true;
    if (import.meta.env.DEV) console.log(`[useEmployeeData] Backfilling coords for ${missing.length} employees`);
    
    (async () => {
      for (const emp of missing) {
        try {
          const coords = await fetchPostnrCoords(emp.home_postcode!);
          if (coords) {
            await supabase.from('profiles').update({ lat: coords.lat, lng: coords.lng }).eq('id', emp.id);
          }
        } catch { /* ignore individual failures */ }
      }
      // Refresh employees to pick up new coords
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    })();
  }, [employees, isDemoMode, queryClient]);

  // Show error toasts
  useEffect(() => {
    if (!queryError) return;
    const errorMessage = queryError instanceof Error ? queryError.message : 'Failed to fetch employees';
    if (!errorMessage.includes('logged in') && !errorMessage.includes('Authentication required') && !isDemoMode) {
      toast({ title: t('common.error') || 'Error', description: t('employees.fetchError') || 'Error loading employees', variant: 'destructive' });
    }
  }, [queryError]);

  // Realtime subscription
  const realtimeThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userDataLoaded || !user || isDemoMode) return;

    const unsubscribe = subscribeToTables(
      `useEmployeeData:${user.id}`,
      [
        { table: 'profiles' },
        { table: 'user_roles' },
      ],
      (table, payload) => {
        if (import.meta.env.DEV) console.log(`[useEmployeeData] ${table} change detected:`, payload?.eventType);
        if (realtimeThrottleRef.current) clearTimeout(realtimeThrottleRef.current);
        realtimeThrottleRef.current = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }, 500);
      }
    );

    return () => {
      if (realtimeThrottleRef.current) clearTimeout(realtimeThrottleRef.current);
      unsubscribe();
    };
  }, [isDemoMode, userDataLoaded, user, queryClient]);

  return {
    employees,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch employees') : null,
    fetchEmployees: async () => { await refetch(); }
  };
};
