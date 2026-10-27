import { describe, expect, it } from 'vitest';
import { calendarChange, calendarEmployeeIds, calendarPayload } from './calendarDrag';
import type { Assignment } from '@/types/assignment';

const task: Assignment = { id: 'task', title: 'Case', date: '2026-10-27', location: 'Address', fromTime: '08:00', toTime: '10:00', published: true, employees: ['one'], assignedEmployees: [{ id: 'one', name: 'One', email: '' }], cars: ['car'], responsibleUserId: 'manager', subDepartmentId: 'sub', lat: 55, description: 'Keep' };
describe('Calendar task gestures', () => {
  it('moves 08:00–10:00 to 10:00–12:00 preserving duration', () => {
    expect(calendarChange(task, 'move', 80, 'one')).toEqual({ fromTime: '10:00', toTime: '12:00', employeeId: 'one' });
  });
  it('reassigns the sole executing employee', () => {
    expect(calendarChange(task, 'move', 0, 'two')?.employeeId).toBe('two');
  });
  it('deduplicates employee representations', () => expect(calendarEmployeeIds(task)).toEqual(['one']));
  it('blocks movement when more than one employee is assigned', () => {
    expect(calendarChange({ ...task, employees: ['one', 'two'] }, 'move', 80, 'two')).toBeNull();
  });
  it('blocks resize for multiple employees', () => {
    expect(calendarChange({ ...task, employees: ['one', 'two'] }, 'end', 80, 'one')).toBeNull();
  });
  it('extends the end from 10:00 to 12:00', () => expect(calendarChange(task, 'end', 80, 'two')).toEqual({ fromTime: '08:00', toTime: '12:00', employeeId: 'one' }));
  it('shortens the end from 10:00 to 09:00', () => expect(calendarChange(task, 'end', -40, 'one')?.toTime).toBe('09:00'));
  it('resizes the start without changing employee', () => expect(calendarChange(task, 'start', 40, 'two')).toEqual({ fromTime: '09:00', toTime: '10:00', employeeId: 'one' }));
  it('cannot resize past the opposite boundary', () => expect(calendarChange(task, 'start', 200, 'one')?.fromTime).toBe('09:45'));
  it('preserves duration at midnight boundaries', () => expect(calendarChange(task, 'move', -1000, 'one')).toEqual({ fromTime: '00:00', toTime: '02:00', employeeId: 'one' }));
  it('does not move into the following day', () => expect(calendarChange(task, 'move', 1000, 'one')).toEqual({ fromTime: '21:59', toTime: '23:59', employeeId: 'one' }));
  it('rejects invalid source time order', () => expect(calendarChange({ ...task, toTime: '07:00' }, 'move', 80, 'one')).toBeNull());
  it('preserves publication, cars, case metadata and subdepartment in the update payload', () => {
    const result = calendarPayload(task, { fromTime: '10:00', toTime: '12:00', employeeId: 'two' });
    expect(result).toEqual({ ...task, fromTime: '10:00', toTime: '12:00', employees: ['two'], assignedEmployees: undefined });
    expect(task.employees).toEqual(['one']);
  });
});