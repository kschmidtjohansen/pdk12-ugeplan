import type { Duty, DutyType } from '@/types/duty';

export type DutyTypeFilter = 'all' | DutyType;

export interface DutyFilterState {
  type: DutyTypeFilter;
  employeeId: string; // 'all' or an employee id
}

export const DEFAULT_DUTY_FILTERS: DutyFilterState = { type: 'all', employeeId: 'all' };

/** Pure filter applied to duties shown in calendar and list. */
export function filterDuties<T extends Pick<Duty, 'duty_type' | 'employee_id'>>(
  duties: T[],
  filters: DutyFilterState,
): T[] {
  return duties.filter((d) =>
    (filters.type === 'all' || d.duty_type === filters.type) &&
    (filters.employeeId === 'all' || d.employee_id === filters.employeeId),
  );
}

export const isDutyFilterActive = (f: DutyFilterState) => f.type !== 'all' || f.employeeId !== 'all';
