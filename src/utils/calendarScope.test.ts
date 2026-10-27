import { describe, expect, it } from 'vitest';
import type { Assignment } from '@/types/assignment';
import { sharedCalendarTasks, sameAssignmentScope } from './calendarScope';
const task: Assignment = { id: '03-task', departmentId: '03', title: 'Dennis opgave', date: '2026-10-27', fromTime: '08:00', toTime: '10:00', location: 'Adresse', published: true, employees: ['dennis'] };
describe('Shared original calendar tasks', () => {
  it('shows Dennis original task from 03 in his 14 calendar', () => {
    expect(sharedCalendarTasks([task], '14', ['dennis'])).toEqual([task]);
  });
  it('does not pull other employees tasks into the calendar', () => {
    expect(sharedCalendarTasks([task], '14', ['other'])).toEqual([]);
  });
  it('does not duplicate tasks from the selected department', () => {
    expect(sharedCalendarTasks([task], '03', ['dennis'])).toEqual([]);
  });
  it('requires a selected department', () => {
    expect(sharedCalendarTasks([task], null, ['dennis'])).toEqual([]);
  });
  it('keeps same-case series separated by source department', () => {
    expect(sameAssignmentScope(task, { ...task, departmentId: '14' })).toBe(false);
    expect(sameAssignmentScope(task, { ...task, id: 'sibling' })).toBe(true);
  });
});