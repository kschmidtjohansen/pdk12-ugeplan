import { describe, expect, it } from 'vitest';
import type { Assignment } from '@/types/assignment';
import { carStatusKind, carsToday } from './carToday';

const A = (id: string, car: string, from: string, to: string, names: string[], date = '2026-11-20'): Assignment =>
  ({ id, title: id, date, fromTime: from, toTime: to, location: 'Skovvej 12, 6000 Kolding', published: true, cars: [car], car, assignedEmployees: names.map(n => ({ id: n, name: n, email: '' })) });

describe('carToday', () => {
  const now = 10 * 60 + 42;
  it('picks the current assignment and its crew', () => {
    const m = carsToday([A('a', 'c1', '07:00', '12:00', ['Ali Demir', 'Sara Kjær']), A('b', 'c1', '13:00', '15:00', ['Ali Demir'])], '2026-11-20', now);
    expect(m.get('c1')).toMatchObject({ names: ['Ali Demir', 'Sara Kjær'], place: 'Skovvej 12', until: '12:00', missingCrew: false, done: false });
  });
  it('flags a car booked without crew and ignores other days', () => {
    const m = carsToday([A('a', 'c2', '12:30', '15:00', []), A('b', 'c3', '07:00', '12:00', ['x'], '2026-11-21')], '2026-11-20', now);
    expect(carStatusKind(true, m.get('c2'))).toBe('missing');
    expect(m.has('c3')).toBe(false);
  });
  it('treats unavailable first and finished days as free', () => {
    const m = carsToday([A('a', 'c4', '07:00', '09:00', ['x'])], '2026-11-20', now);
    expect(carStatusKind(true, m.get('c4'))).toBe('free');
    expect(carStatusKind(false, m.get('c4'))).toBe('unavailable');
    expect(carStatusKind(true, undefined)).toBe('free');
  });
});
