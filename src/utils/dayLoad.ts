import type { Assignment } from '@/types/assignment';

const toMin = (t?: string) => { const [h, m] = (t ?? '').split(':'); return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0); };

/** Samlede mandetimer på dagen (opgavens varighed × antal medarbejdere). */
export function dayPersonHours(assignments: Assignment[]): number {
  return assignments.reduce((sum, a) => {
    const mins = Math.max(0, toMin(a.toTime) - toMin(a.fromTime));
    const people = Math.max(1, a.employees?.length ?? 0);
    return sum + (mins / 60) * people;
  }, 0);
}

export type DayLoadLevel = 0 | 1 | 2 | 3;
/** 0 = tom, 1 = rolig (< 16 t), 2 = travl (< 40 t), 3 = meget travl (≥ 40 t). */
export function dayLoadLevel(hours: number): DayLoadLevel {
  if (hours <= 0) return 0;
  if (hours < 16) return 1;
  if (hours < 40) return 2;
  return 3;
}
