import { Assignment } from '@/types/assignment';

/** 07:00–09:00 (and other days): the whole day at a glance. After 09:00 today: the signage loop. */
export type ScreenMode = 'overview' | 'signage';

export const SIGNAGE_FROM_MINUTES = 9 * 60;
export const SIGNAGE_PAGE_SECONDS = 60;

const toMin = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Which layout the screen shows. `param` is the ?mode= override (overview | signage);
 * anything else means automatic: signage on today's date from 09:00, otherwise the overview.
 */
export const pickScreenMode = (now: Date, selectedDate: Date, param?: string | null): ScreenMode => {
  if (param === 'overview' || param === 'signage') return param;
  const isToday = ymd(now) === ymd(selectedDate);
  return isToday && now.getHours() * 60 + now.getMinutes() >= SIGNAGE_FROM_MINUTES ? 'signage' : 'overview';
};

export const sortByTime = (assignments: Assignment[]) =>
  [...assignments].sort((a, b) => toMin(a.fromTime) - toMin(b.fromTime) || (a.title ?? '').localeCompare(b.title ?? '', 'da'));

export interface Crew {
  /** Car name, or null for people on tasks without a car. */
  car: string | null;
  people: string[];
  /** The crew's first task of the day. */
  first?: Assignment;
}

/**
 * "Hvem kører med hvem": one crew per car with everyone on that car's tasks, in car-number order,
 * plus one crew (car = null) for people whose tasks have no car.
 */
export const buildCrews = (assignments: Assignment[]): Crew[] => {
  const sorted = sortByTime(assignments);
  const byCar = new Map<string, Crew>();
  const noCar: Crew = { car: null, people: [] };
  const withCar = new Set<string>();
  sorted.forEach(a => {
    const names = (a.assignedEmployees ?? []).map(e => e?.name).filter((n): n is string => !!n);
    const cars = (a.cars ?? []).filter((c): c is string => typeof c === 'string' && !!c);
    if (cars.length === 0) return;
    cars.forEach(car => {
      const crew = byCar.get(car) ?? { car, people: [], first: a };
      names.forEach(n => { if (!crew.people.includes(n)) crew.people.push(n); withCar.add(n); });
      byCar.set(car, crew);
    });
  });
  sorted.forEach(a => {
    if ((a.cars ?? []).length > 0) return;
    (a.assignedEmployees ?? []).forEach(e => {
      const n = e?.name;
      if (n && !withCar.has(n) && !noCar.people.includes(n)) {
        noCar.people.push(n);
        noCar.first ??= a;
      }
    });
  });
  const crews = Array.from(byCar.values())
    .map(c => ({ ...c, people: [...c.people].sort((x, y) => x.localeCompare(y, 'da')) }))
    .sort((x, y) => (x.car ?? '').localeCompare(y.car ?? '', 'da', { numeric: true }));
  return noCar.people.length ? [...crews, { ...noCar, people: [...noCar.people].sort((x, y) => x.localeCompare(y, 'da')) }] : crews;
};

export const chunk = <T,>(list: T[], size: number): T[][] => {
  if (size <= 0 || list.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

export type SignagePage =
  | { kind: 'crews'; crews: Crew[]; part: number; parts: number }
  | { kind: 'tasks'; tasks: Assignment[]; part: number; parts: number }
  | { kind: 'absent'; names: string[] };

/**
 * The loop after 09:00: crews, then today's tasks, then who is away (only if anyone is).
 * With `nowMinutes`, tasks that have already ended are left out of the task pages (unless all have).
 */
export const buildSignagePages = (assignments: Assignment[], absentNames: string[], crewsPerPage = 6, tasksPerPage = 8, nowMinutes?: number): SignagePage[] => {
  const crewParts = chunk(buildCrews(assignments), crewsPerPage);
  const sorted = sortByTime(assignments);
  const open = nowMinutes === undefined ? sorted : sorted.filter(a => toMin(a.toTime) >= nowMinutes);
  const taskParts = chunk(open.length ? open : sorted, tasksPerPage);
  const pages: SignagePage[] = [
    ...crewParts.map((crews, i) => ({ kind: 'crews' as const, crews, part: i + 1, parts: crewParts.length })),
    ...taskParts.map((tasks, i) => ({ kind: 'tasks' as const, tasks, part: i + 1, parts: taskParts.length })),
  ];
  if (absentNames.length) pages.push({ kind: 'absent', names: absentNames });
  return pages;
};

/** A task with no people on it. */
export const missingTeam = (a: Assignment) => (a.assignedEmployees ?? []).length === 0;
