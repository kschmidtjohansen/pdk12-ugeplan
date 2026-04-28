import { Assignment } from '@/types/assignment';

export type ConflictKind = 'employee' | 'car';

export interface AssignmentConflict {
  kind: ConflictKind;
  resourceId: string;
  resourceName: string;
  withAssignmentId: string;
  withTitle: string;
  withTime: { from: string; to: string };
}

/** Returns true when [aFrom, aTo) and [bFrom, bTo) overlap (touching is NOT overlap). */
export function timesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  if (!aFrom || !aTo || !bFrom || !bTo) return false;
  return aFrom < bTo && bFrom < aTo;
}

const norm = (t?: string) => (t ? t.substring(0, 5) : '');

const getCarIds = (a: Assignment): string[] => {
  if (a.cars && Array.isArray(a.cars) && a.cars.length > 0) return a.cars.filter(Boolean);
  if (a.car) {
    if (typeof a.car === 'string') return [a.car];
    if (typeof a.car === 'object' && a.car.id) return [a.car.id];
  }
  return [];
};

const getEmployeeIds = (a: Assignment): string[] => {
  const ids: string[] = [];
  if (a.assignedEmployees?.length) ids.push(...a.assignedEmployees.map(e => e.id).filter(Boolean));
  // Some legacy rows store IDs in the `employees` array
  if (a.employees?.length) {
    a.employees.forEach(v => {
      // crude UUID check
      if (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)) ids.push(v);
    });
  }
  return Array.from(new Set(ids));
};

export interface ConflictMaps {
  byAssignment: Map<string, AssignmentConflict[]>;
}

export function computeConflicts(
  assignments: Assignment[],
  employees: Array<{ id: string; name: string }>,
  cars: Array<{ id: string; name: string }>,
): ConflictMaps {
  const empName = new Map(employees.map(e => [e.id, e.name]));
  const carName = new Map(cars.map(c => [c.id, c.name]));
  const byAssignment = new Map<string, AssignmentConflict[]>();

  // bucket by date
  const byDate = new Map<string, Assignment[]>();
  assignments.forEach(a => {
    if (!a.date) return;
    if (!byDate.has(a.date)) byDate.set(a.date, []);
    byDate.get(a.date)!.push(a);
  });

  const push = (id: string, c: AssignmentConflict) => {
    if (!byAssignment.has(id)) byAssignment.set(id, []);
    byAssignment.get(id)!.push(c);
  };

  byDate.forEach(list => {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const aFrom = norm(a.fromTime);
      const aTo = norm(a.toTime);
      const aEmps = getEmployeeIds(a);
      const aCars = getCarIds(a);

      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const bFrom = norm(b.fromTime);
        const bTo = norm(b.toTime);
        if (!timesOverlap(aFrom, aTo, bFrom, bTo)) continue;

        // Employee overlaps
        getEmployeeIds(b).forEach(eid => {
          if (aEmps.includes(eid)) {
            const name = empName.get(eid) || 'Medarbejder';
            push(a.id, {
              kind: 'employee', resourceId: eid, resourceName: name,
              withAssignmentId: b.id, withTitle: b.title || b.case_number || '—',
              withTime: { from: bFrom, to: bTo },
            });
            push(b.id, {
              kind: 'employee', resourceId: eid, resourceName: name,
              withAssignmentId: a.id, withTitle: a.title || a.case_number || '—',
              withTime: { from: aFrom, to: aTo },
            });
          }
        });

        // Car overlaps
        getCarIds(b).forEach(cid => {
          if (aCars.includes(cid)) {
            const name = carName.get(cid) || 'Bil';
            push(a.id, {
              kind: 'car', resourceId: cid, resourceName: name,
              withAssignmentId: b.id, withTitle: b.title || b.case_number || '—',
              withTime: { from: bFrom, to: bTo },
            });
            push(b.id, {
              kind: 'car', resourceId: cid, resourceName: name,
              withAssignmentId: a.id, withTitle: a.title || a.case_number || '—',
              withTime: { from: aFrom, to: aTo },
            });
          }
        });
      }
    }
  });

  return { byAssignment };
}
