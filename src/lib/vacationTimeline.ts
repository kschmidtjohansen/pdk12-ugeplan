import { addDays, addWeeks, parseISO } from 'date-fns';
import type { Vacation } from '@/types/vacation';
import { parseLeaveReason } from '@/components/Vacation/leaveType';

/** Weeks shown in the Fridage overview (about half a year). */
export const WEEKS = 26;

export type Kind = 'Ferie' | 'Feriefridag' | 'Afspadsering' | 'pending' | 'other';
export const kindOf = (v: Vacation): Kind => v.status === 'pending' ? 'pending' : (parseLeaveReason(v.reason || '').type ?? 'other');

/** Which weeks (index from start) a vacation touches. Pure, for the overview rows. */
export const weeksTouched = (v: Vacation, start: Date, weeks = WEEKS): number[] => {
  const out: number[] = [];
  const s = parseISO(v.start_date), e = parseISO(v.end_date);
  for (let i = 0; i < weeks; i++) {
    const ws = addWeeks(start, i), we = addDays(ws, 6);
    if (s <= we && e >= ws) out.push(i);
  }
  return out;
};

