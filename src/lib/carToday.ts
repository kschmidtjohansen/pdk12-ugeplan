import type { Assignment } from '@/types/assignment';
import { currentOrNext, shortPlace } from './employeeToday';

export interface CarToday {
  /** Names of the crew on the car's current or next assignment today. */
  names: string[];
  place?: string;
  until?: string;
  from?: string;
  /** The assignment has the car but nobody on it yet. */
  missingCrew: boolean;
  /** The assignment is over for today. */
  done: boolean;
}

const carIdsOf = (a: Assignment): string[] => {
  const ids = new Set<string>();
  (a.cars || []).forEach(id => id && ids.add(id));
  if (typeof a.car === 'string' && a.car) ids.add(a.car);
  else if (a.car && typeof a.car === 'object') ids.add(a.car.id);
  return [...ids];
};

const t5 = (t?: string) => (t || '').slice(0, 5);
const mins = (t?: string) => { const [h, m] = t5(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };

/** Per car: who drives it today and where, from today's assignments (no extra queries). */
export const carsToday = (assignments: Assignment[], date: string, nowMinutes: number): Map<string, CarToday> => {
  const byCar = new Map<string, Assignment[]>();
  assignments.filter(a => a.date === date).forEach(a => carIdsOf(a).forEach(id => byCar.set(id, [...(byCar.get(id) ?? []), a])));
  const out = new Map<string, CarToday>();
  byCar.forEach((list, id) => {
    const sorted = [...list].sort((x, y) => mins(x.fromTime) - mins(y.fromTime));
    const cur = currentOrNext(sorted, nowMinutes);
    if (!cur) return;
    const names = (cur.assignedEmployees ?? []).map(e => e.name).filter(Boolean);
    out.set(id, { names, place: shortPlace(cur.location), until: t5(cur.toTime), from: t5(cur.fromTime), missingCrew: names.length === 0, done: mins(cur.toTime) <= nowMinutes });
  });
  return out;
};

export type CarStatusKind = 'unavailable' | 'missing' | 'inuse' | 'free';
export const carStatusKind = (available: boolean, today?: CarToday): CarStatusKind =>
  !available ? 'unavailable' : today && !today.done ? (today.missingCrew ? 'missing' : 'inuse') : 'free';
