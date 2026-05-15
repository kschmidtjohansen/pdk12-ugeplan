import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';

export interface AutoPublishLogEntry {
  id: string;
  run_at: string;
  assignments_updated: number;
  department_id: string | null;
  triggered_by: string;
}

export const useAutoPublishLog = (limit = 10) => {
  const { selectedDepartmentId } = useDepartment();
  const { isEffectiveAdmin, effectiveRole } = useAuth();
  const enabled =
    isEffectiveAdmin || effectiveRole === 'skadeleder' || effectiveRole === 'super_admin';

  return useQuery({
    queryKey: ['auto_publish_log', selectedDepartmentId, limit],
    enabled: enabled && !!selectedDepartmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AutoPublishLogEntry[]> => {
      const { data, error } = await supabase
        .from('auto_publish_log')
        .select('id, run_at, assignments_updated, department_id, triggered_by')
        .eq('department_id', selectedDepartmentId!)
        .order('run_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data ?? []) as AutoPublishLogEntry[];
    },
  });
};
