import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';

/**
 * Fetch department IDs that share duties with the currently selected department.
 * Configuration is stored in `department_settings` under key `shared_duty_departments`
 * as a JSON-array of UUIDs.
 */
export const useSharedDutyDepartments = (departmentId?: string | null) => {
  const { selectedDepartmentId } = useDepartment();
  const effectiveDeptId = departmentId ?? selectedDepartmentId;

  const query = useQuery({
    queryKey: ['shared_duty_departments', effectiveDeptId],
    queryFn: async (): Promise<string[]> => {
      if (!effectiveDeptId) return [];

      const { data, error } = await supabase
        .from('department_settings')
        .select('setting_value')
        .eq('department_id', effectiveDeptId)
        .eq('setting_key', 'shared_duty_departments')
        .maybeSingle();

      if (error || !data?.setting_value) return [];

      try {
        const parsed = JSON.parse(data.setting_value);
        if (Array.isArray(parsed)) {
          return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
        }
      } catch {
        return [];
      }
      return [];
    },
    enabled: !!effectiveDeptId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    sharedDepartmentIds: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
