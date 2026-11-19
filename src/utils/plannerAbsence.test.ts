import { describe, expect, it } from 'vitest';
import type { Vacation } from '@/types/vacation';
import { approvedAbsencesOnDate, partialAbsencePeriod } from './plannerAbsence';

const absence: Vacation = {
  id: 'absence', user_id: 'employee', status: 'approved',
  start_date: '2026-11-19', end_date: '2026-11-19',
  request_type: 'partial_day', start_time: '13:00:00', end_time: '16:00:00',
};

describe('planner absence periods', () => {
  it('includes an absence starting at 13:00 on the selected day', () => {
    const selected = approvedAbsencesOnDate([absence], '2026-11-19');
    expect(selected.map(v => v.user_id)).toEqual(['employee']);
    expect(partialAbsencePeriod(selected[0])).toBe('13:00–16:00');
  });

  it('preserves the 14:30–15:00 partial absence from the reference', () => {
    expect(partialAbsencePeriod({ ...absence, start_time: '14:30:00', end_time: '15:00:00' })).toBe('14:30–15:00');
  });

  it('does not include another day or unapproved requests', () => {
    expect(approvedAbsencesOnDate([absence], '2026-11-20')).toEqual([]);
    expect(approvedAbsencesOnDate([{ ...absence, status: 'pending' }, { ...absence, status: 'rejected' }], '2026-11-19')).toEqual([]);
  });

  it('does not attach a partial period to full-day absence', () => {
    expect(partialAbsencePeriod({ ...absence, request_type: 'full_day' })).toBeUndefined();
  });

  it('retains multiple approved periods for the same employee', () => {
    const later = { ...absence, id: 'later', start_time: '14:30:00', end_time: '15:00:00' };
    expect(approvedAbsencesOnDate([absence, later], '2026-11-19').map(partialAbsencePeriod)).toEqual(['13:00–16:00', '14:30–15:00']);
  });
});