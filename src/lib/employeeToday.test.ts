import { describe, expect, it } from 'vitest';
import type { Assignment } from '@/types/assignment';
import { assignmentsFor, overlapWindow, shortPlace, todayStatus } from './employeeToday';

const A = (id: string, from: string, to: string, ids: string[], location = 'Skovvej 12, 6000 Kolding', date = '2026-11-20'): Assignment =>
  ({ id, title: id, date, fromTime: from, toTime: to, location, published: true, assignedEmployees: ids.map(i => ({ id: i, name: i, email: '' })) });
const fmt = (d: string) => d.slice(8, 10) + '.';
const base = { nowMinutes: 10 * 60 + 42, formatDate: fmt, da: true };

describe('employeeToday', () => {
  it('finds a person\'s assignments on a date, earliest first', () => {
    const list = [A('b', '13:00', '15:00', ['p']), A('a', '07:00', '09:00', ['p']), A('c', '08:00', '09:00', ['q']), A('d', '08:00', '09:00', ['p'], 'x', '2026-11-21')];
    expect(assignmentsFor(list, 'p', '2026-11-20').map(a => a.id)).toEqual(['a', 'b']);
  });

  it('flags overlapping assignments as double-booked', () => {
    expect(overlapWindow([A('a', '10:00', '12:00', ['p']), A('b', '11:00', '13:00', ['p'])])).toEqual({ from: '11:00', to: '12:00' });
    expect(overlapWindow([A('a', '10:00', '11:00', ['p']), A('b', '11:00', '13:00', ['p'])])).toBeNull();
    expect(todayStatus({ ...base, today: [A('a', '10:00', '12:00', ['p']), A('b', '11:00', '13:00', ['p'])] })).toMatchObject({ kind: 'double', label: 'Dobbeltbooket 11–12' });
  });

  it('shows the current or next assignment, else free', () => {
    expect(todayStatus({ ...base, today: [A('a', '07:00', '12:00', ['p'])] })).toMatchObject({ kind: 'onjob', label: 'På opgave · Skovvej 12' });
    expect(todayStatus({ ...base, today: [A('a', '07:00', '09:00', ['p'])] })).toMatchObject({ kind: 'free', label: 'Ledig' });
    expect(todayStatus({ ...base, today: [] })).toMatchObject({ kind: 'free' });
  });

  it('lets absence win over assignments and hides the sick reason when not allowed', () => {
    const today = [A('a', '07:00', '12:00', ['p'])];
    expect(todayStatus({ ...base, today, sick: true, canSeeSickReason: true }).label).toBe('Syg');
    expect(todayStatus({ ...base, today, sick: true }).label).toBe('Fraværende');
    expect(todayStatus({ ...base, today, vacationUntil: '2026-11-23' }).label).toBe('Ferie til 23.');
    expect(todayStatus({ ...base, today, training: true }).kind).toBe('training');
  });

  it('shortens an address to its first part', () => {
    expect(shortPlace('Vestergade 4, 7000 Fredericia')).toBe('Vestergade 4');
  });
});
