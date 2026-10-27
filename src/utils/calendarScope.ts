import type { Assignment } from '@/types/assignment';
import { calendarEmployeeIds } from './calendarDrag';

/** Only already-authorized source tasks belonging to visible employee calendars. */
export function sharedCalendarTasks(tasks: Assignment[], departmentId: string | null, employeeIds: string[]): Assignment[] {
  if (!departmentId) return [];
  const visible = new Set(employeeIds);
  return tasks.filter(task => task.departmentId !== departmentId && calendarEmployeeIds(task).some(id => visible.has(id)));
}

export function sameAssignmentScope(a: Assignment, b: Assignment): boolean {
  return a.departmentId === b.departmentId;
}