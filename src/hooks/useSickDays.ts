import { useEffect, useId, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';
import { subscribeToTable } from '@/lib/realtimeChannels';

/**
 * Sick-leave marking is a per-day flag set manually by administrators.
 *
 * Visibility rules (enforced in the database, mirrored here):
 * - administrators / skadeledere may read the `sick_days` rows directly and
 *   therefore know the absence reason is sickness.
 * - all other roles only receive the list of absent user ids through the
 *   security-definer RPC `list_department_absent_user_ids`, so they can see
 *   that someone is absent but never why.
 */
interface SickDaysResult {
  ids: Set<string>;
  /** true when the current user is allowed to see that the reason is sickness */
  canSeeReason: boolean;
}

function useSickForDate(dateStr: string) {
  const { selectedDepartmentId } = useDepartment();
  const { isAdmin, isSkadeleder } = usePermissions();
  const queryClient = useQueryClient();
  const instanceId = useId();

  const canSeeReason = Boolean(isAdmin || isSkadeleder);

  const query = useQuery<SickDaysResult>({
    queryKey: ['sick-days', selectedDepartmentId, dateStr, canSeeReason],
    enabled: !!selectedDepartmentId && !!dateStr,
    queryFn: async () => {
      if (canSeeReason) {
        const { data, error } = await supabase
          .from('sick_days')
          .select('user_id')
          .eq('department_id', selectedDepartmentId!)
          .eq('sick_date', dateStr);
        if (error) throw error;
        return {
          ids: new Set<string>((data || []).map((r: any) => r.user_id)),
          canSeeReason: true,
        };
      }

      const { data, error } = await supabase.rpc('list_department_absent_user_ids', {
        _department_id: selectedDepartmentId!,
        _date: dateStr,
      });
      if (error) throw error;
      return {
        ids: new Set<string>((data || []).map((r: any) => r.user_id)),
        canSeeReason: false,
      };
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!selectedDepartmentId) return;
    return subscribeToTable({
      key: `sick-days:${instanceId}:${selectedDepartmentId}:${dateStr}`,
      table: 'sick_days',
      filter: `department_id=eq.${selectedDepartmentId}`,
      callback: () => {
        queryClient.invalidateQueries({ queryKey: ['sick-days', selectedDepartmentId] });
      },
    });
  }, [selectedDepartmentId, dateStr, queryClient, instanceId]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sick-days'] });
  }, [queryClient]);

  return {
    sickIds: query.data?.ids ?? new Set<string>(),
    canSeeSickReason: canSeeReason,
    isLoading: query.isLoading,
    invalidate,
  };
}

export function useSickToday() {
  return useSickForDate(format(new Date(), 'yyyy-MM-dd'));
}

export function useSickForDateValue(date: Date | string) {
  const dateStr =
    typeof date === 'string'
      ? (date.includes('T') ? date.split('T')[0] : date)
      : format(date, 'yyyy-MM-dd');
  return useSickForDate(dateStr);
}
