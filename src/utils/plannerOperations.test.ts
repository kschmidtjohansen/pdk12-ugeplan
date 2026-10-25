import { describe, expect, it } from 'vitest';
import { assignmentsInWeek, filterPlannerAssignments, plannerOperationsLink, readPlannerLocation, summarizeWeek } from './plannerOperations';
import type { Assignment } from '@/types/assignment';

const e1 = '11111111-1111-1111-1111-111111111111';
const e2 = '22222222-2222-2222-2222-222222222222';
const task = (id: string, overrides: Partial<Assignment> = {}): Assignment => ({ id, title: 'Vandskade', date: '2026-12-28', fromTime: '08:00', toTime: '12:00', location: 'Havnegade', published: true, ...overrides });
const employees = [{ id: e1, name: 'Anna' }, { id: e2, name: 'Bo' }];
describe('Ugens operationelle signaler', () => {
  it('tæller publicerede og upublicerede konkret', () => {
    const result = summarizeWeek([task('a'), task('b', { published: false })], [], []);
    expect(result.total).toBe(2); expect(result.drafts).toBe(1);
  });
  it('genkender nye og legacy medarbejder-IDer; sagsansvarlig er ikke bemanding', () => {
    const result = summarizeWeek([task('a', { employees: [e1] }), task('b', { assignedEmployees: [{ id: e2, name: 'Bo', email: '' }] }), task('c', { responsibleUserId: e1 })], employees, []);
    expect(result.unassigned).toBe(1);
  });
  it('tæller berørte opgaver én gang selv med flere ressource-overlap', () => {
    const result = summarizeWeek([task('a', { employees: [e1, e2], cars: ['car'] }), task('b', { employees: [e1, e2], cars: ['car'] })], employees, [{ id: 'car', name: 'Bil' }]);
    expect(result.conflicts).toBe(2);
    expect(result.conflictMap.get('a')).toHaveLength(2);
    expect(result.conflictMap.get('a')?.some(c => c.kind === 'car')).toBe(false);
  });
  it('samme hold undtager kun bil-overlap; forskellige hold giver bilkonflikt', () => {
    const result = summarizeWeek([task('a', { employees: [e1], car: { id: 'car', name: 'Bil' } }), task('b', { employees: [e2], car: 'car' })], employees, []);
    expect(result.conflicts).toBe(2); expect(result.conflictMap.get('a')?.[0].kind).toBe('car');
  });
  it('tilstødende tider er ikke konflikter og manglende bil er ikke en fejl', () => {
    const result = summarizeWeek([task('a', { employees: [e1] }), task('b', { employees: [e1], fromTime: '12:00', toTime: '16:00' })], employees, []);
    expect(result.conflicts).toBe(0); expect(result.unassigned).toBe(0);
  });
  it('tom uge har nul i alle signaler', () => {
    const result = summarizeWeek([], [], []);
    expect([result.total, result.drafts, result.unassigned, result.conflicts]).toEqual([0, 0, 0, 0]);
  });
  it('ISO uge 53 2026 inkluderer januar 2027 uden UTC-parsing', () => {
    const list = [task('a'), task('b', { date: '2027-01-03' }), task('c', { date: '2027-01-04' })];
    expect(assignmentsInWeek(list, 53, 2026).map(a => a.id)).toEqual(['a', 'b']);
    expect(readPlannerLocation(new URLSearchParams('week=53&year=2026&issue=drafts'))).toEqual({ week: 53, year: 2026, issue: 'drafts' });
  });
  it('dashboard-link roundtrip bevarer uge, ISO-år og filter', () => {
    const link = plannerOperationsLink(1, 2027, 'unassigned');
    expect(readPlannerLocation(new URL(link, 'https://example.invalid').searchParams)).toEqual({ week: 1, year: 2027, issue: 'unassigned' });
  });
  it('afviser ugyldige og ikke-eksisterende ISO-uger', () => {
    expect(readPlannerLocation(new URLSearchParams('week=53&year=2027&issue=evil'))).toEqual({ week: undefined, year: undefined, issue: 'all' });
    expect(readPlannerLocation(new URLSearchParams('week=99&year=NaN'))).toEqual({ week: undefined, year: undefined, issue: 'all' });
  });
  it('kombinerer status, tekst, medarbejder og dag med AND uden mutation', () => {
    const list = [task('a', { employees: [e1], published: false }), task('b', { employees: [e2], published: false }), task('c', { employees: [e1] })];
    const original = JSON.stringify(list);
    const summary = summarizeWeek(list, employees, []);
    expect(filterPlannerAssignments(list, summary, { issue: 'drafts', query: 'Anna', employeeIds: [e1], day: '2026-12-28' }, employees).map(a => a.id)).toEqual(['a']);
    expect(JSON.stringify(list)).toBe(original);
  });
  it('konfliktfilter bevarer konflikter med en opgave skjult af tekstfilter', () => {
    const list = [task('a', { employees: [e1] }), task('b', { employees: [e1], title: 'Brand' })];
    const summary = summarizeWeek(list, employees, []);
    expect(filterPlannerAssignments(list, summary, { issue: 'conflicts', query: 'Brand', employeeIds: [] }, employees).map(a => a.id)).toEqual(['b']);
    expect(summary.conflicts).toBe(2);
  });
});