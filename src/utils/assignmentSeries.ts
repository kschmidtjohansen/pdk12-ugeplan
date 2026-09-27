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

/**
 * Returns the position of an assignment within its multi-day series,
 * e.g. { index: 2, total: 5 } for "Dag 2 af 5". Returns null for one-off jobs.
 */
export const getSeriesPosition = (
  assignment: Pick<Assignment, 'id' | 'groupId' | 'case_number' | 'title' | 'date'> | null | undefined,
  allAssignments: Assignment[] | null | undefined
): { index: number; total: number } | null => {
  if (!assignment?.id || !allAssignments || allAssignments.length === 0) return null;

  const siblingIds = new Set(getSeriesSiblingIds(assignment, allAssignments));
  if (siblingIds.size <= 1) return null;

  const dates = Array.from(
    new Set(
      allAssignments
        .filter(a => siblingIds.has(a.id) && typeof a.date === 'string' && a.date)
        .map(a => (a.date.includes('T') ? a.date.split('T')[0] : a.date))
    )
  ).sort();

  if (dates.length <= 1) return null;

  const own = assignment.date?.includes('T') ? assignment.date.split('T')[0] : assignment.date;
  const index = own ? dates.indexOf(own) + 1 : 0;
  if (index <= 0) return null;

  return { index, total: dates.length };
};
