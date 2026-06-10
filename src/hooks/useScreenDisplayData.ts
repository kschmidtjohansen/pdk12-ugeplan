import { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { convertOptimizedAssignmentToAssignment, OptimizedAssignmentData } from '@/utils/assignmentDataConverter';

interface UseScreenDisplayDataResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Public kiosk data hook. Uses the SECURITY DEFINER RPC
 * `list_screen_display_assignments` so the /screen-display page works without
 * authentication. Requires a department id (otherwise returns empty).
 */
export const useScreenDisplayData = (
  date: string,
  departmentId?: string | null,
  subDepartmentId?: string | null
): UseScreenDisplayDataResult => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!departmentId) {
        setAssignments([]);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        'list_screen_display_assignments',
        {
          p_department_id: departmentId,
          p_sub_department_id: subDepartmentId || null,
          p_date: date || null,
        }
      );

      if (rpcError) {
        if (import.meta.env.DEV) console.error('[useScreenDisplayData] RPC error:', rpcError);
        throw new Error(rpcError.message);
      }

      const rows = (data as any[]) || [];

      // Map RPC shape → OptimizedAssignmentData → Assignment (shared converter
      // gives us camelCase + assignedEmployees etc. that the UI expects)
      const converted = rows.map((a) => {
        const optimized: OptimizedAssignmentData = {
          id: a.id,
          title: a.title,
          description: a.description,
          assignment_date: a.assignment_date,
          from_time: a.from_time,
          to_time: a.to_time,
          location: a.location,
          type: a.type,
          published: a.published,
          responsible_user_id: a.responsible_user_id,
          created_at: a.created_at,
          updated_at: a.updated_at,
          car_id: a.car_id,
          car_ids: a.car_ids || [],
          group_id: null,
          responsible_user: a.responsible_user
            ? { id: a.responsible_user.id, name: a.responsible_user.name }
            : null,
          assignment_employees: Array.isArray(a.team)
            ? a.team.map((m: any) => ({
                user_id: m.id,
                profiles: { id: m.id, name: m.name },
              }))
            : [],
          assignment_cars: Array.isArray(a.cars)
            ? a.cars.map((c: any) => ({ id: c.id, name: c.name }))
            : [],
        };
        return convertOptimizedAssignmentToAssignment(optimized);
      });

      setAssignments(converted);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useScreenDisplayData] error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [date, departmentId, subDepartmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { assignments, loading, error, refetch };
};
