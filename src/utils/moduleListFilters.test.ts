import { describe, expect, it } from 'vitest';
import { filterCars, filterEmployees, filterVacations, vacationEmployeeIds, visibleVacations } from './moduleListFilters';
import type { Employee } from '@/types/employee';
import type { Vacation } from '@/types/vacation';
import { formatDateToYYYYMMDD } from './dateUtils';

const employee = (id: string, name: string): Employee => ({ id, name, email: `${id}@example.invalid`, role: 'servicemedarbejder', status: 'active' });
const vacation = (id: string, user_id: string, status: Vacation['status']): Vacation => ({ id, user_id, status, start_date: '2026-10-25', end_date: '2026-10-26', user: { id: user_id, name: user_id, email: '' } });
describe('module UI filters preserve existing visibility and semantics', () => {
  it('uses Vacation.user_id and inclusive local dates, approved only', () => {
    const day = formatDateToYYYYMMDD(new Date(2026, 9, 25, 0, 1));
    expect(day).toBe('2026-10-25');
    expect([...vacationEmployeeIds([vacation('1', 'Anna', 'approved'), vacation('2', 'Bo', 'pending')], day)]).toEqual(['Anna']);
    expect([...vacationEmployeeIds([vacation('1', 'Anna', 'approved')], '2026-10-27')]).toEqual([]);
  });
  it('combines employee status/search and temporary list without mutating records', () => {
    const rows = [employee('1', 'Anna'), employee('2', 'Bo'), employee('3', 'Vikar')];
    expect(filterEmployees(rows, rows.slice(0, 2), rows.slice(2), 'active', 'ANNA', new Set(['2']))).toEqual([rows[0]]);
    expect(filterEmployees(rows, rows.slice(0, 2), rows.slice(2), 'onleave', '', new Set(['2']))).toEqual([rows[1]]);
    expect(filterEmployees(rows, rows.slice(0, 2), rows.slice(2), 'vikarer', '', new Set())).toEqual([rows[2]]);
    expect(filterEmployees(rows, rows, [], 'all', 'missing', new Set())).toEqual([]);
    expect(filterEmployees([], [], [], 'all', '', new Set())).toEqual([]);
    expect(rows).toHaveLength(3);
  });
  it('scheduled future period is separate from current availability status', () => {
    const future = { name: 'Servicebil', car_number: '06', number_plate: 'AB12345', is_available: true, _scheduledUpcoming: { start_date: '2026-11-01' } };
    const unavailable = { name: 'Varebil', car_number: '07', is_available: false };
    expect(filterCars([future, unavailable], 'scheduled', 'ab123')).toEqual([future]);
    expect(filterCars([future, unavailable], 'available', '')).toEqual([future]);
    expect(filterCars([future, unavailable], 'unavailable', '')).toEqual([unavailable]);
    expect(filterCars([], 'all', '')).toEqual([]);
  });
  it('counts and search operate only on already visible vacation rows', () => {
    const rows = [vacation('1', 'self', 'pending'), vacation('2', 'other', 'pending'), vacation('3', 'other', 'approved'), vacation('4', 'other', 'rejected')];
    expect(visibleVacations(rows, 'self', false, true).map(v => v.id)).toEqual(['1']);
    expect(visibleVacations(rows, 'self', false, false).map(v => v.id)).toEqual(['1', '3']);
    expect(visibleVacations(rows, 'self', true, false)).toHaveLength(4);
    expect(visibleVacations(rows, undefined, true, false)).toEqual([]);
    expect(filterVacations(visibleVacations(rows, 'self', false, true), 'all', 'other')).toEqual([]);
    expect(filterVacations(rows, 'rejected', '')).toEqual([rows[3]]);
    expect(filterVacations(rows, 'approved', 'other')).toEqual([rows[2]]);
    expect(filterVacations([], 'pending', '')).toEqual([]);
  });
  it('view_all_vacations grant lets a servicemedarbejder see every request', () => {
    const rows = [vacation('1', 'self', 'pending'), vacation('2', 'other', 'pending'), vacation('3', 'other', 'approved'), vacation('4', 'other', 'rejected')];
    expect(visibleVacations(rows, 'self', false, true, true)).toHaveLength(4);
    expect(visibleVacations(rows, 'self', false, false, true)).toHaveLength(4);
    expect(visibleVacations(rows, 'self', false, true, false)).toHaveLength(1);
  });
});