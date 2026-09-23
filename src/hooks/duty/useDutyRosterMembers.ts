import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useSharedDutyDepartments } from './useSharedDutyDepartments';

/**
 * IDs of everyone who is — or previously has been — on the duty plan for the
 * selected department (and any shared duty departments). Used to limit the
 * proximity lookup to actual duty personnel.
 */
export const useDutyRosterMembers = () => {
  const { user, isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const { sharedDepartmentIds } = useSharedDutyDepartments();

  const departmentIds = [selectedDepartmentId, ...sharedDepartmentIds].filter(
    (id): id is string => !!id
  );

  const query = useQuery({
    queryKey: ['duty_roster_members', departmentIds.slice().sort().join(',')] as const,
    queryFn: async (): Promise<string[]> => {
      if (departmentIds.length === 0) return [];

      const { data, error } = await supabase
        .from('on_call_duties')
        .select('employee_id')
        .in('department_id', departmentIds)
        .eq('is_demo', false)
        .not('employee_id', 'is', null)
        .limit(5000);

      if (error) throw new Error(error.message);

      const ids = new Set<string>();
      (data || []).forEach((row: { employee_id: string | null }) => {
        if (row.employee_id) ids.add(row.employee_id);
      });
      return Array.from(ids);
    },
    enabled: !!user && !isDemoMode && departmentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    rosterIds: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
};
