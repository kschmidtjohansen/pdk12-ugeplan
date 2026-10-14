import { describe, it, expect } from 'vitest';
import { computeConflicts, sameCrew, timesOverlap } from './assignmentConflicts';
import type { Assignment } from '@/types/assignment';

const E1 = '11111111-1111-1111-1111-111111111111';
const E2 = '22222222-2222-2222-2222-222222222222';
const E3 = '33333333-3333-3333-3333-333333333333';

const make = (id: string, from: string, to: string, emps: string[], car?: string): Assignment =>
  ({ id, title: id, date: '2026-10-14', fromTime: from, toTime: to,
     assignedEmployees: emps.map(e => ({ id: e, name: e })), cars: car ? [car] : [] }) as unknown as Assignment;

describe('timesOverlap', () => {
  it('detects overlap', () => expect(timesOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true));
  it('touching is not overlap', () => expect(timesOverlap('08:00', '10:00', '10:00', '11:00')).toBe(false));
  it('missing times never overlap', () => expect(timesOverlap('', '10:00', '09:00', '11:00')).toBe(false));
});

describe('sameCrew', () => {
  it('identical crew', () => expect(sameCrew([E1, E2], [E2, E1])).toBe(true));
  it('subset counts as same crew', () => expect(sameCrew([E1], [E1, E2])).toBe(true));
  it('different crew', () => expect(sameCrew([E1], [E2])).toBe(false));
  it('empty crew is never same', () => expect(sameCrew([], [E1])).toBe(false));
});

describe('computeConflicts (booking flow)', () => {
  it('flags double-booked employee', () => {
    const r = computeConflicts([make('a', '08:00', '10:00', [E1]), make('b', '09:00', '11:00', [E1])], [], []);
    expect(r.byAssignment.get('a')?.[0].kind).toBe('employee');
  });
  it('same crew sharing a car is not a car conflict', () => {
    const r = computeConflicts([make('a', '08:00', '10:00', [E1, E2], 'car49'), make('b', '09:00', '11:00', [E1, E2], 'car49')], [], []);
    expect(r.byAssignment.get('a')?.some(c => c.kind === 'car')).toBeFalsy();
  });
  it('different crews sharing a car is a car conflict', () => {
    const r = computeConflicts([make('a', '08:00', '10:00', [E1], 'car49'), make('b', '09:00', '11:00', [E3], 'car49')], [], []);
    expect(r.byAssignment.get('b')?.[0].kind).toBe('car');
  });
  it('non-overlapping tasks have no conflicts', () => {
    const r = computeConflicts([make('a', '08:00', '10:00', [E1], 'c'), make('b', '10:00', '12:00', [E1], 'c')], [], []);
    expect(r.byAssignment.size).toBe(0);
  });
});
