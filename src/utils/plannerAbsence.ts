import type { Vacation } from '@/types/vacation';

/** Keep planner absence periods tied to the selected local calendar date. */
export const approvedAbsencesOnDate = (vacations: Vacation[], dateKey: string): Vacation[] =>
  vacations.filter(v => v.status === 'approved' && dateKey >= v.start_date && dateKey <= v.end_date);

export const partialAbsencePeriod = (vacation: Vacation): string | undefined => {
  if (vacation.request_type !== 'partial_day' || !vacation.start_time || !vacation.end_time) return undefined;
  return `${vacation.start_time.slice(0, 5)}–${vacation.end_time.slice(0, 5)}`;
};