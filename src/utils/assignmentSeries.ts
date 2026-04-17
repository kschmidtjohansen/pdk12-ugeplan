import { Assignment } from '@/types/assignment';

/**
 * Returns the IDs of all assignments belonging to the same series as the given assignment.
 *
 * Series detection rules (matches `findSeriesSiblings` in PlannerPage):
 * 1. If the assignment has a `groupId`, return all assignments with the same groupId.
 * 2. Otherwise fall back to matching on `case_number` (preferred) or `title`.
 * 3. If nothing matches, return just the assignment's own id.
 *
 * Used so that chat messages and files attached to one day of a multi-day case
 * are visible from every day of that same case.
 */
export const getSeriesSiblingIds = (
  assignment: Pick<Assignment, 'id' | 'groupId' | 'case_number' | 'title'> | null | undefined,
  allAssignments: Assignment[] | null | undefined
): string[] => {
  if (!assignment?.id) return [];
  if (!allAssignments || allAssignments.length === 0) return [assignment.id];

  if (assignment.groupId) {
    const ids = allAssignments
      .filter(a => a.groupId === assignment.groupId)
      .map(a => a.id);
    return ids.length > 0 ? ids : [assignment.id];
  }

  const key =
    (assignment.case_number && assignment.case_number.trim()) ||
    assignment.title?.trim();
  if (!key) return [assignment.id];

  const ids = allAssignments
    .filter(a => {
      const aKey = (a.case_number && a.case_number.trim()) || a.title?.trim();
      return aKey === key;
    })
    .map(a => a.id);

  return ids.length > 0 ? ids : [assignment.id];
};
