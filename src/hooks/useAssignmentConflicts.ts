import { useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { computeConflicts, AssignmentConflict } from '@/utils/assignmentConflicts';

export interface UseAssignmentConflictsResult {
  getConflicts: (assignmentId: string) => AssignmentConflict[];
  hasConflicts: (assignmentId: string) => boolean;
  totalCount: number;
}

/**
 * Compute employee/car double-booking conflicts within the given assignment list
 * (typically a single week). Pure client-side logic over already-fetched data.
 */
export const useAssignmentConflicts = (
  assignments: Assignment[] | undefined | null,
): UseAssignmentConflictsResult => {
  const { employees } = useEmployees();
  const { cars } = useCars();

  const map = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return new Map<string, AssignmentConflict[]>();
    }
    const empList = (employees || []).map((e: any) => ({ id: e.id, name: e.name || e.email || '' }));
    const carList = (cars || []).map((c: any) => ({ id: c.id, name: c.name || '' }));
    return computeConflicts(assignments, empList, carList).byAssignment;
  }, [assignments, employees, cars]);

  return {
    getConflicts: (id: string) => map.get(id) || [],
    hasConflicts: (id: string) => (map.get(id)?.length ?? 0) > 0,
    totalCount: map.size,
  };
};
