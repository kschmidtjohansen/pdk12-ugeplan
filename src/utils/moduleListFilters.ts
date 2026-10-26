import type { Employee } from '@/types/employee';
import type { Vacation } from '@/types/vacation';

export function vacationEmployeeIds(vacations: Vacation[], localDay: string) {
  return new Set(vacations.filter(v => v.status === 'approved' && v.start_date <= localDay && v.end_date >= localDay).map(v => v.user_id));
}

export function filterEmployees(rows: Employee[], regular: Employee[], temporary: Employee[], segment: string, search: string, absent: Set<string>) {
  const selected = segment === 'active' ? regular.filter(e => !absent.has(e.id)) : segment === 'onleave' ? rows.filter(e => absent.has(e.id)) : segment === 'vikarer' ? temporary : rows;
  const q = search.trim().toLowerCase();
  return selected.filter(e => !q || [e.name, e.email, e.jobTitle].some(value => value?.toLowerCase().includes(q)));
}

export function filterCars<T extends { name?: string; car_number?: string; number_plate?: string; is_available?: boolean; _scheduledActive?: unknown; _scheduledUpcoming?: unknown }>(rows: T[], segment: string, search: string): T[] {
  const q = search.trim().toLowerCase();
  return rows.filter(c => (segment === 'available' ? c.is_available !== false : segment === 'unavailable' ? c.is_available === false : segment === 'scheduled' ? !!(c._scheduledActive || c._scheduledUpcoming) : true)
    && (!q || [c.name, c.car_number, c.number_plate].some(value => value?.toLowerCase().includes(q))));
}

/** Same visibility rules as the existing VacationTabContent, applied before counts. Roles granted "view_all_vacations" by IT-Support see every row. */
export function visibleVacations(rows: Vacation[], userId: string | undefined, isAdmin: boolean, isService: boolean, canViewAll = false) {
  if (!userId) return [];
  if (isAdmin || canViewAll) return rows;
  return rows.filter(v => isService ? v.user_id === userId : v.user_id === userId || v.status === 'approved');
}
export function filterVacations(rows: Vacation[], tab: string, search: string, userId?: string) {
  const q = search.trim().toLowerCase();
  return rows.filter(v => (['pending', 'approved', 'rejected'].includes(tab) ? v.status === tab : tab === 'mine' ? v.user_id === userId : true)
    && (!q || [v.user?.name, v.reason, v.start_date, v.end_date].some(value => value?.toLowerCase().includes(q))))
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || a.start_date.localeCompare(b.start_date));
}