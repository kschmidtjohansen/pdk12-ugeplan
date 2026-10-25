import type { Assignment } from '@/types/assignment';
import { computeConflicts, getAssignmentEmployeeIds } from './assignmentConflicts';
import { getWeekDates } from './dates';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export const operationFilters = ['all', 'drafts', 'unassigned', 'conflicts'] as const;
export type OperationFilter = typeof operationFilters[number];
export const isOperationFilter = (value: string | null): value is OperationFilter =>
  operationFilters.some(filter => filter === value);

/** Same loaded, department-scoped week is used by dashboard and planner. */
export function assignmentsInWeek(assignments: Assignment[], week: number, year: number) {
  const { startStr, endStr } = getWeekDates(week, year);
  return assignments.filter(a => a.date >= startStr && a.date <= endStr);
}

export function summarizeWeek(
  assignments: Assignment[],
  employees: Array<{ id: string; name: string }>,
  cars: Array<{ id: string; name: string }>,
) {
  const conflicts = computeConflicts(assignments, employees, cars);
  return {
    total: assignments.length,
    drafts: assignments.filter(a => a.published !== true).length,
    unassigned: assignments.filter(a => getAssignmentEmployeeIds(a).length === 0).length,
    // Assignments affected, NOT pairs or resource overlap records.
    conflicts: conflicts.byAssignment.size,
    conflictMap: conflicts.byAssignment,
  };
}
export type WeekSummary = ReturnType<typeof summarizeWeek>;

export function filterPlannerAssignments(
  assignments: Assignment[], summary: WeekSummary,
  filters: { issue: OperationFilter; query: string; employeeIds: string[]; day?: string },
  employees: Array<{ id: string; name: string }>,
) {
  const names = new Map(employees.map(e => [e.id, e.name.toLocaleLowerCase()]));
  const query = filters.query.trim().toLocaleLowerCase();
  return assignments.filter(a => {
    const ids = getAssignmentEmployeeIds(a);
    if (filters.day && a.date !== filters.day) return false;
    if (filters.issue === 'drafts' && a.published === true) return false;
    if (filters.issue === 'unassigned' && ids.length > 0) return false;
    if (filters.issue === 'conflicts' && !summary.conflictMap.has(a.id)) return false;
    if (filters.employeeIds.length && !ids.some(id => filters.employeeIds.includes(id))) return false;
    return !query || [a.case_number, a.title, a.location, a.city, a.zip_code, a.description,
      ...ids.map(id => names.get(id)), ...(a.assignedEmployees || []).map(e => e.name)]
      .some(value => value?.toLocaleLowerCase().includes(query));
  }).sort((a, b) => a.date.localeCompare(b.date) || a.fromTime.localeCompare(b.fromTime));
}

export function readPlannerLocation(params: URLSearchParams) {
  const week = Number(params.get('week'));
  const year = Number(params.get('year'));
  let validWeek = Number.isInteger(week) && week >= 1 && week <= 53 && Number.isInteger(year) && year >= 2000 && year <= 2100;
  if (validWeek) {
    const start = getWeekDates(week, year).start;
    validWeek = getISOWeek(start) === week && getISOWeekYear(start) === year;
  }
  const issue = params.get('issue');
  return { week: validWeek ? week : undefined, year: validWeek ? year : undefined,
    issue: isOperationFilter(issue) ? issue : 'all' as OperationFilter };
}

export function plannerOperationsLink(week: number, year: number, issue: OperationFilter) {
  return `/planner?${new URLSearchParams({ week: String(week), year: String(year), issue })}`;
}