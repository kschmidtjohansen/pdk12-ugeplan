import type { Assignment } from '@/types/assignment';

/** Status of a person today, as the canvas card shows it. */
export type TodayKind = 'sick' | 'absent' | 'training' | 'vacation' | 'double' | 'onjob' | 'free';
export type TodayTone = 'info' | 'success' | 'warning' | 'destructive' | 'muted';

export interface TodayStatus {
  kind: TodayKind;
  tone: TodayTone;
  /** Short label for the card chip, e.g. "På opgave · Skovvej 12". */
  label: string;
}

const hhmm = (t?: string) => (t || '').slice(0, 5);
const mins = (t?: string) => { const [h, m] = hhmm(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };

/** First part of an address ("Skovvej 12, 6000 Kolding" → "Skovvej 12"). */
export const shortPlace = (location?: string) => (location || '').split(',')[0].trim();

/** Is the person on this assignment? Works with both the team list and the id list. */
export const isOnAssignment = (a: Assignment, employeeId: string): boolean =>
  !!a.assignedEmployees?.some(e => e.id === employeeId) || !!a.employees?.includes(employeeId);

/** The person's assignments on a date, earliest first. */
export const assignmentsFor = (assignments: Assignment[], employeeId: string, date: string): Assignment[] =>
  assignments
    .filter(a => a.date === date && isOnAssignment(a, employeeId))
    .sort((x, y) => mins(x.fromTime) - mins(y.fromTime));

/** Two assignments the same day whose times overlap; returns the overlapping window or null. */
export const overlapWindow = (list: Assignment[]): { from: string; to: string } | null => {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const from = Math.max(mins(a.fromTime), mins(b.fromTime));
      const to = Math.min(mins(a.toTime), mins(b.toTime));
      if (from < to) {
        const f = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        return { from: f(from), to: f(to) };
      }
    }
  }
  return null;
};

/** The assignment going on now, else the next one today, else the last one. */
export const currentOrNext = (list: Assignment[], nowMinutes: number): Assignment | undefined =>
  list.find(a => mins(a.fromTime) <= nowMinutes && nowMinutes < mins(a.toTime))
  ?? list.find(a => mins(a.fromTime) > nowMinutes)
  ?? list[list.length - 1];

export interface TodayInput {
  today: Assignment[];
  nowMinutes: number;
  sick?: boolean;
  canSeeSickReason?: boolean;
  training?: boolean;
  onLeave?: boolean;
  /** End date (yyyy-MM-dd) of an approved full-day vacation covering today. */
  vacationUntil?: string | null;
  /** Formats a yyyy-MM-dd date for the vacation chip. */
  formatDate: (date: string) => string;
  da: boolean;
}

/** Decides the chip on a person's card. Absence wins over assignments; overlapping assignments are flagged. */
export const todayStatus = (i: TodayInput): TodayStatus => {
  if (i.sick) return i.canSeeSickReason
    ? { kind: 'sick', tone: 'warning', label: i.da ? 'Syg' : 'Sick' }
    : { kind: 'absent', tone: 'warning', label: i.da ? 'Fraværende' : 'Absent' };
  if (i.vacationUntil) return { kind: 'vacation', tone: 'success', label: `${i.da ? 'Ferie til' : 'Off until'} ${i.formatDate(i.vacationUntil)}` };
  if (i.training) return { kind: 'training', tone: 'warning', label: i.da ? 'Kursus' : 'Training' };
  if (i.onLeave) return { kind: 'absent', tone: 'warning', label: i.da ? 'Fraværende' : 'Absent' };
  const clash = overlapWindow(i.today);
  if (clash) return { kind: 'double', tone: 'destructive', label: `${i.da ? 'Dobbeltbooket' : 'Double-booked'} ${clash.from.replace(':00', '')}–${clash.to.replace(':00', '')}` };
  const cur = currentOrNext(i.today, i.nowMinutes);
  if (cur && mins(cur.toTime) > i.nowMinutes) return { kind: 'onjob', tone: 'info', label: `${i.da ? 'På opgave' : 'On job'} · ${shortPlace(cur.location)}` };
  return { kind: 'free', tone: 'muted', label: i.da ? 'Ledig' : 'Free' };
};

export const TONE_CHIP: Record<TodayTone, string> = {
  info: 'bg-info-soft text-info-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  warning: 'bg-warning-soft text-warning-soft-foreground',
  destructive: 'bg-destructive-soft text-destructive-soft-foreground',
  muted: 'bg-muted text-muted-foreground',
};

export const TONE_RING: Record<TodayTone, string> = {
  info: 'border-info-soft-foreground/40',
  success: 'border-success-soft-foreground/40',
  warning: 'border-warning-soft-foreground/40',
  destructive: 'border-destructive-soft-foreground/40',
  muted: 'border-border',
};

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2);
