import type { Assignment } from '@/types/assignment';
import { HOUR_PX, toMinutes } from './calendarTimeGrid';

export type CalendarDragMode = 'move' | 'start' | 'end';
export interface CalendarChange { fromTime: string; toTime: string; employeeId: string }
export const calendarEmployeeIds = (task: Assignment): string[] =>
  [...new Set([...(task.employees ?? []), ...(task.assignedEmployees?.map(e => e.id) ?? [])])];
const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Fifteen-minute movement, bounded to the same local calendar day. */
export function calendarChange(task: Assignment, mode: CalendarDragMode, deltaY: number, employeeId: string): CalendarChange | null {
  const ids = calendarEmployeeIds(task);
  const start = toMinutes(task.fromTime), end = toMinutes(task.toTime);
  if (ids.length !== 1 || start === null || end === null || end <= start || start < 0 || end > 1439) return null;
  const delta = Math.round(deltaY / HOUR_PX * 60 / 15) * 15;
  let s = start, e = end;
  if (mode === 'move') {
    const shift = Math.max(-start, Math.min(delta, 1439 - end));
    s += shift; e += shift;
  } else if (mode === 'start') s = Math.max(0, Math.min(start + delta, end - 15));
  else e = Math.min(1439, Math.max(end + delta, start + 15));
  return { fromTime: time(s), toTime: time(e), employeeId: mode === 'move' ? employeeId : ids[0] };
}

export function calendarPayload(task: Assignment, change: CalendarChange): Assignment {
  return { ...task, fromTime: change.fromTime, toTime: change.toTime, employees: [change.employeeId], assignedEmployees: undefined };
}