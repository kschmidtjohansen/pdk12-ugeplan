import { describe, expect, it } from 'vitest';
import type { Vacation } from '@/types/vacation';
import { kindOf, weeksTouched } from './vacationTimeline';

const V = (s: string, e: string, status: Vacation['status'] = 'approved', reason = 'Ferie'): Vacation => ({ id: 'v', user_id: 'u', start_date: s, end_date: e, status, reason });
const start = new Date('2026-10-26T00:00:00');

describe('vacationTimeline', () => {
  it('maps a request to its type, pending first', () => {
    expect(kindOf(V('2026-12-01', '2026-12-02'))).toBe('Ferie');
    expect(kindOf(V('2026-12-01', '2026-12-02', 'approved', 'Afspadsering – tandlæge'))).toBe('Afspadsering');
    expect(kindOf(V('2026-12-01', '2026-12-02', 'pending'))).toBe('pending');
    expect(kindOf(V('2026-12-01', '2026-12-02', 'approved', 'noget andet'))).toBe('other');
  });
  it('lists the weeks a period touches', () => {
    expect(weeksTouched(V('2026-10-26', '2026-10-26'), start)).toEqual([0]);
    expect(weeksTouched(V('2026-11-01', '2026-11-03'), start)).toEqual([0, 1]);
    expect(weeksTouched(V('2026-09-01', '2026-09-05'), start)).toEqual([]);
  });
});
