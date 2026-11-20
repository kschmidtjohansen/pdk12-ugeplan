import type { Assignment } from '@/types/assignment';
import type { Employee } from '@/types/employee';
import type { Vacation } from '@/types/vacation';
import { getAssignmentEmployeeIds } from '@/utils/assignmentConflicts';
import { parseLeaveReason } from '@/components/Vacation/leaveType';
import { approvedAbsencesOnDate, partialAbsencePeriod } from '@/utils/plannerAbsence';

/** A working day on the board counts as 8 hours. */
export const DAY_MINUTES = 8 * 60;

const t5 = (t?: string) => (t || '').slice(0, 5);
const mins = (t?: string) => { const [h, m] = t5(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };

export interface BoardCell {
  date: string;
  tasks: Assignment[];
  /** Full-day absence label (Ferie, Feriefridag, Afspadsering, Fri, Kursus, Syg, Fraværende). */
  off: string | null;
  /** Part-day absence, e.g. "fri 13:00–16:00". */
  partOff: string | null;
  /** Booked share of a working day, 0–∞ (percent). */
  load: number;
  conflict: boolean;
}

export interface BoardRow {
  /** Null for the "Uden medarbejder" row. */
  employee: Employee | null;
  cells: BoardCell[];
  conflicts: number;
}

export interface BoardInput {
  employees: Employee[];
  assignments: Assignment[];
  days: string[];
  vacations: Vacation[];
  trainingRanges: Map<string, Array<{ start_date: string; end_date: string }>>;
  /** People marked sick today; only the today column shows it. */
  sickToday: Set<string>;
  canSeeSickReason: boolean;
  today: string;
  conflictIds: Set<string>;
  da: boolean;
}

const byStart = (a: Assignment, b: Assignment) => mins(a.fromTime) - mins(b.fromTime);

/** Absence for one person on one date: full-day label or part-day window. */
export const absenceOn = (i: Pick<BoardInput, 'vacations' | 'trainingRanges' | 'sickToday' | 'canSeeSickReason' | 'today' | 'da'>, e: Employee, date: string) => {
  if (date === i.today && i.sickToday.has(e.id)) return { off: i.canSeeSickReason ? (i.da ? 'Syg' : 'Sick') : (i.da ? 'Fraværende' : 'Absent'), partOff: null };
  if ((i.trainingRanges.get(e.id) ?? []).some(r => r.start_date <= date && r.end_date >= date)) return { off: i.da ? 'Kursus' : 'Training', partOff: null };
  const vac = approvedAbsencesOnDate(i.vacations, date).find(v => v.user_id === e.id);
  if (vac) {
    const part = partialAbsencePeriod(vac);
    if (part) return { off: null, partOff: `${i.da ? 'fri' : 'off'} ${part}` };
    return { off: parseLeaveReason(vac.reason || '').type ?? (i.da ? 'Fri' : 'Off'), partOff: null };
  }
  if (e.onLeave || e.status === 'on_leave') return { off: i.da ? 'Fraværende' : 'Absent', partOff: null };
  return { off: null, partOff: null };
};

/** People × days with each person's tasks, absence, load and conflicts (lærredets Tavle). Pure. */
export const buildBoard = (i: BoardInput): BoardRow[] => {
  const rows: BoardRow[] = i.employees.map(e => {
    const cells = i.days.map(date => {
      const tasks = i.assignments.filter(a => a.date === date && getAssignmentEmployeeIds(a).includes(e.id)).sort(byStart);
      const minutes = tasks.reduce((s, a) => s + Math.max(0, mins(a.toTime) - mins(a.fromTime)), 0);
      const abs = absenceOn(i, e, date);
      return { date, tasks, off: abs.off, partOff: abs.partOff, load: Math.round((minutes / DAY_MINUTES) * 100), conflict: tasks.some(a => i.conflictIds.has(a.id)) };
    });
    return { employee: e, cells, conflicts: cells.filter(c => c.conflict).length };
  });
  const loose = i.assignments.filter(a => getAssignmentEmployeeIds(a).length === 0);
  if (loose.length) {
    rows.unshift({
      employee: null,
      cells: i.days.map(date => ({ date, tasks: loose.filter(a => a.date === date).sort(byStart), off: null, partOff: null, load: 0, conflict: false })),
      conflicts: 0,
    });
  }
  return rows;
};

export interface Unassigned {
  people: Array<{ employee: Employee; partOff: string | null }>;
  cars: string[];
}

/** Who and which cars have nothing on a given date (available people, available cars). Pure. */
export const unassignedOn = (
  i: Pick<BoardInput, 'vacations' | 'trainingRanges' | 'sickToday' | 'canSeeSickReason' | 'today' | 'da'> & { employees: Employee[]; assignments: Assignment[]; cars: Array<{ id: string; car_number?: string; name: string; is_available?: boolean }> },
  date: string,
): Unassigned => {
  const day = i.assignments.filter(a => a.date === date);
  const busy = new Set(day.flatMap(a => getAssignmentEmployeeIds(a)));
  const usedCars = new Set(day.flatMap(a => [...(a.cars ?? []), typeof a.car === 'string' ? a.car : a.car?.id].filter(Boolean) as string[]));
  const people = i.employees
    .filter(e => !busy.has(e.id))
    .map(e => ({ employee: e, ...absenceOn(i, e, date) }))
    .filter(p => !p.off)
    .map(p => ({ employee: p.employee, partOff: p.partOff }));
  const cars = i.cars.filter(c => c.is_available !== false && !usedCars.has(c.id)).map(c => c.car_number ? `BIL ${String(c.car_number).replace(/^bil\s*/i, '')}` : c.name);
  return { people, cars };
};

export const loadTone = (pct: number) => pct > 100 ? 'bg-destructive' : pct >= 85 ? 'bg-warning' : 'bg-primary';
