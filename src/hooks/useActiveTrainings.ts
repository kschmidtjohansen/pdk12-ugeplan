import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { format } from 'date-fns';

export interface ActiveTrainingInfo {
  title: string | null;
  end_date: string;
}

export function useActiveTrainings() {
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const query = useQuery({
    queryKey: ['active-trainings', selectedDepartmentId, today],
    enabled: !!selectedDepartmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('user_id, title, end_date, start_date')
        .eq('department_id', selectedDepartmentId!)
        .lte('start_date', today)
        .gte('end_date', today);
      if (error) throw error;
      const ids = new Set<string>();
      const info = new Map<string, ActiveTrainingInfo>();
      (data || []).forEach((t: any) => {
        ids.add(t.user_id);
        info.set(t.user_id, { title: t.title, end_date: t.end_date });
      });
      return { ids, info };
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedDepartmentId) return;
    const channel = supabase
      .channel(`active-trainings-${selectedDepartmentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainings', filter: `department_id=eq.${selectedDepartmentId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-trainings', selectedDepartmentId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDepartmentId, queryClient]);

  return {
    trainingIds: query.data?.ids ?? new Set<string>(),
    trainingInfo: query.data?.info ?? new Map<string, ActiveTrainingInfo>(),
    isLoading: query.isLoading,
  };
}
