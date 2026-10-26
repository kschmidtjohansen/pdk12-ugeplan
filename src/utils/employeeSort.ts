import type { Employee } from '@/types/employee';

/**
 * Sorts employees with the current user's own employee record first,
 * then everyone else alphabetically (Danish locale). Used by the
 * calendar/Outlook view so your own column always leads.
 */
export const sortEmployeesOwnFirst = (employees: Employee[], currentUserId?: string | null): Employee[] =>
  [...employees].sort((a, b) => {
    const aOwn = currentUserId && a.id === currentUserId ? 0 : 1;
    const bOwn = currentUserId && b.id === currentUserId ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;
    return a.name.localeCompare(b.name, 'da');
  });
