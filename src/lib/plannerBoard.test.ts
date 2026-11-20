import { describe, expect, it } from 'vitest';
import type { Assignment } from '@/types/assignment';
import type { Employee } from '@/types/employee';
import type { Vacation } from '@/types/vacation';
import { buildBoard, unassignedOn, loadTone } from './plannerBoard';

const E = (id: string, extra: Partial<Employee> = {}): Employee => ({ id, name: id, email: '', role: 'servicemedarbejder', status: 'active', ...extra });
const A = (id: string, date: string, from: string, to: string, ids: string[], car?: string): Assignment =>
  ({ id, title: id, date, fromTime: from, toTime: to, location: 'x', published: true, assignedEmployees: ids.map(i => ({ id: i, name: i, email: '' })), cars: car ? [car] : [], car });
const base = { trainingRanges: new Map(), sickToday: new Set<string>(), canSeeSickReason: true, today: '2026-11-20', conflictIds: new Set<string>(), da: true };
const days = ['2026-11-19', '2026-11-20'];

describe('plannerBoard', () => {
  it('puts each task in the person\'s day cell with load and conflicts', () => {
    const rows = buildBoard({ ...base, employees: [E('p')], assignments: [A('a', '2026-11-20', '07:00', '12:00', ['p']), A('b', '2026-11-20', '11:00', '16:00', ['p'])], days, vacations: [], conflictIds: new Set(['a', 'b']) });
    expect(rows).toHaveLength(1);
    expect(rows[0].cells[1].tasks.map(t => t.id)).toEqual(['a', 'b']);
    expect(rows[0].cells[1].load).toBe(125);
    expect(rows[0].cells[1].conflict).toBe(true);
    expect(rows[0].conflicts).toBe(1);
    expect(loadTone(125)).toBe('bg-destructive');
  });

  it('shows absence: vacation type, part day, training and sick today', () => {
    const vac: Vacation[] = [
      { id: 'v1', user_id: 'p', start_date: '2026-11-19', end_date: '2026-11-19', status: 'approved', reason: 'Feriefridag' },
      { id: 'v2', user_id: 'q', start_date: '2026-11-19', end_date: '2026-11-19', status: 'approved', reason: 'Afspadsering', request_type: 'partial_day', start_time: '13:00:00', end_time: '16:00:00' },
      { id: 'v3', user_id: 'r', start_date: '2026-11-19', end_date: '2026-11-19', status: 'pending', reason: 'Ferie' },
    ];
    const rows = buildBoard({ ...base, employees: [E('p'), E('q'), E('r'), E('s')], assignments: [], days, vacations: vac,
      trainingRanges: new Map([['s', [{ start_date: '2026-11-19', end_date: '2026-11-19' }]]]), sickToday: new Set(['r']) });
    expect(rows[0].cells[0].off).toBe('Feriefridag');
    expect(rows[1].cells[0]).toMatchObject({ off: null, partOff: 'fri 13:00–16:00' });
    expect(rows[2].cells[0].off).toBeNull();
    expect(rows[2].cells[1].off).toBe('Syg');
    expect(rows[3].cells[0].off).toBe('Kursus');
  });

  it('adds an "Uden medarbejder" row for tasks without people', () => {
    const rows = buildBoard({ ...base, employees: [E('p')], assignments: [A('a', '2026-11-20', '07:00', '12:00', [])], days, vacations: [] });
    expect(rows[0].employee).toBeNull();
    expect(rows[0].cells[1].tasks).toHaveLength(1);
  });

  it('lists free people and unused available cars for a date', () => {
    const u = unassignedOn({ ...base, employees: [E('p'), E('q'), E('r', { onLeave: true })], assignments: [A('a', '2026-11-20', '07:00', '12:00', ['p'], 'c1')], vacations: [],
      cars: [{ id: 'c1', name: 'Transit', car_number: '07' }, { id: 'c2', name: 'Caddy', car_number: 'BIL 09' }, { id: 'c3', name: 'Crafter', car_number: '11', is_available: false }] }, '2026-11-20');
    expect(u.people.map(p => p.employee.id)).toEqual(['q']);
    expect(u.cars).toEqual(['BIL 09']);
  });
});
