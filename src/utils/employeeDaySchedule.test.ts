import { describe, it, expect } from 'vitest';
import { getEmployeeDaySchedule } from './employeeAvailability';
import type { Assignment } from '@/types/assignment';

const mk = (fromTime: string, toTime: string, date = '2026-10-26', employees = ['e1']) =>
  ({ id: fromTime, date, fromTime, toTime, employees } as unknown as Assignment);

describe('getEmployeeDaySchedule', () => {
  it('lists booked windows and the free time around them', () => {
    const r = getEmployeeDaySchedule({ id: 'e1', name: 'A' }, '2026-10-26', [mk('08:00', '10:00'), mk('12:00', '13:00'), mk('09:00', '15:00', '2026-10-27')]);
    expect(r.booked).toEqual([{ from: '08:00', to: '10:00' }, { from: '12:00', to: '13:00' }]);
    expect(r.free).toEqual([{ from: null, to: '08:00' }, { from: '10:00', to: '12:00' }, { from: '13:00', to: null }]);
  });
  it('merges overlapping bookings and ignores other employees', () => {
    const r = getEmployeeDaySchedule({ id: 'e1', name: 'A' }, '2026-10-26', [mk('08:00', '11:00'), mk('10:00', '12:00'), mk('13:00', '14:00', '2026-10-26', ['e2'])]);
    expect(r.booked).toEqual([{ from: '08:00', to: '12:00' }]);
  });
});
