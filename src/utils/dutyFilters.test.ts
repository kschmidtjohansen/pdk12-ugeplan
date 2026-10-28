import { describe, it, expect } from 'vitest';
import { filterDuties, isDutyFilterActive } from './dutyFilters';

const duties = [
  { id: '1', duty_type: 'skadeleder_vagt' as const, employee_id: 'a' },
  { id: '2', duty_type: 'kørevagt' as const, employee_id: 'a' },
  { id: '3', duty_type: 'kørevagt' as const, employee_id: 'b' },
];

describe('filterDuties', () => {
  it('filters by duty type', () => {
    expect(filterDuties(duties, { type: 'kørevagt', employeeId: 'all' }).map((d) => d.id)).toEqual(['2', '3']);
  });
  it('filters by employee', () => {
    expect(filterDuties(duties, { type: 'all', employeeId: 'a' }).map((d) => d.id)).toEqual(['1', '2']);
  });
  it('combines employee and type', () => {
    expect(filterDuties(duties, { type: 'skadeleder_vagt', employeeId: 'b' })).toEqual([]);
  });
  it('detects active filters', () => {
    expect(isDutyFilterActive({ type: 'all', employeeId: 'all' })).toBe(false);
    expect(isDutyFilterActive({ type: 'all', employeeId: 'a' })).toBe(true);
  });
});
