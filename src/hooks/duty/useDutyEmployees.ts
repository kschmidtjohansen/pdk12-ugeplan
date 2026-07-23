import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToTables } from '@/lib/realtimeChannels';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useSharedDutyDepartments } from './useSharedDutyDepartments';
import type { Employee } from '@/types/employee';

/**
 * Fetch employees for the duty module: includes employees from the selected
 * department AND from any shared duty departments configured on it.
 *
 * The regular `/employees` list continues to use `useEmployeeData`, so employee
 * lists remain isolated per department outside the duty module.
 */
export const useDutyEmployees = () => {
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const { sharedDepartmentIds } = useSharedDutyDepartments();
  const queryClient = useQueryClient();

  const departmentIds = [
    selectedDepartmentId,
    ...sharedDepartmentIds,
  ].filter((id): id is string => !!id);

  const queryKey = ['duty_employees', isDemoMode, departmentIds.sort().join(',')] as const;

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<(Employee & { department_id?: string | null; department_name?: string | null })[]> => {
      if (isDemoMode || departmentIds.length === 0) {
        return [];
      }

      // Get all user IDs with access to any of the target departments
      const { data: accessData, error: accessError } = await supabase
        .from('user_access')
        .select('user_id, department_id')
        .in('department_id', departmentIds);

      if (accessError) throw new Error(`user_access fetch failed: ${accessError.message}`);

      const userIdToDept = new Map<string, string>();
      (accessData || []).forEach((row) => {
        if (!userIdToDept.has(row.user_id)) {
          userIdToDept.set(row.user_id, row.department_id);
        }
      });

      // Fetch profiles for these users. Also include super_admins whose
      // home_department is one of the target departments (they may not have a
      // user_access row).
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, name, email, phone, job_title, on_leave, status, notes, avatar_url,
          has_asbestos_certificate, has_pcb_certificate, has_trailer_license,
          has_drivers_license, has_forklift_license, home_department_id
        `)
        .eq('is_demo', false)
        .order('name', { ascending: true });

      if (profilesError) throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      if (!profiles) return [];

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map<string, string[]>();
      (userRoles || []).forEach((r: any) => {
        const arr = rolesMap.get(r.user_id) || [];
        if (!arr.includes(r.role)) arr.push(r.role);
        rolesMap.set(r.user_id, arr);
      });

      const { getEffectiveRole } = await import('@/utils/roleHierarchy');

      // Fetch department names for labels
      const { data: deptRows } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);
      const deptNameMap = new Map<string, string>();
      (deptRows || []).forEach((d) => deptNameMap.set(d.id, d.name));

      const filtered = profiles.filter((p: any) => {
        if (p.email === 'test@polygongroup.com') return false;
        if (p.id === '165cdbc9-6722-4c96-97d2-1a87185c8133') return false;
        if (userIdToDept.has(p.id)) return true;
        const roles = rolesMap.get(p.id) || [];
        if (roles.includes('super_admin') && p.home_department_id && departmentIds.includes(p.home_department_id)) {
          return true;
        }
        return false;
      });

      return filtered.map((p: any) => {
        const roles = rolesMap.get(p.id) || [];
        const effective = roles.length ? getEffectiveRole(roles as any) : 'servicemedarbejder';
        const deptId = userIdToDept.get(p.id) || p.home_department_id || null;
        return {
          id: p.id,
          name: p.name || 'Unknown',
          email: p.email || '',
          phone: p.phone || '',
          jobTitle: p.job_title || '',
          role: effective as Employee['role'],
          roles: (roles.length ? roles : [effective]) as Employee['roles'],
          onLeave: p.on_leave || false,
          status: p.status || 'active',
          notes: p.notes || '',
          avatar_url: p.avatar_url,
          has_asbestos_certificate: !!p.has_asbestos_certificate,
          has_pcb_certificate: !!p.has_pcb_certificate,
          has_trailer_license: !!p.has_trailer_license,
          has_forklift_license: !!p.has_forklift_license,
          department_id: deptId,
          department_name: deptId ? deptNameMap.get(deptId) || null : null,
        } as Employee & { department_id?: string | null; department_name?: string | null };
      });
    },
    enabled: userDataLoaded && !!user && !isDemoMode && departmentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Realtime invalidation
  useEffect(() => {
    if (!user || isDemoMode) return;
    const unsubscribe = subscribeToTables(
      `useDutyEmployees:${user.id}`,
      [{ table: 'profiles' }, { table: 'user_roles' }, { table: 'user_access' }, { table: 'department_settings' }],
      () => {
        queryClient.invalidateQueries({ queryKey: ['duty_employees'] });
        queryClient.invalidateQueries({ queryKey: ['shared_duty_departments'] });
      }
    );
    return () => { unsubscribe(); };
  }, [user, isDemoMode, queryClient]);

  return {
    employees: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
