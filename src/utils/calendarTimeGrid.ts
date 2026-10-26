/**
 * Pure geometry for the planner calendar/Outlook view.
 *
 * The day grid always covers the full day: 00:00–23:59 (DAY_END_HOUR is
 * exclusive), so assignments outside normal office hours are never clipped.
 */
export const DAY_START_HOUR = 0;
export const DAY_END_HOUR = 24;
export const HOUR_PX = 40;
export const MIN_SLOT_PX = 22;

export const DAY_START_MIN = DAY_START_HOUR * 60;
export const DAY_END_MIN = DAY_END_HOUR * 60;

/** "07:30" -> 450. Missing or unparsable values return null. */
export const toMinutes = (t?: string | null): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

/** Every hour row in the grid: 0, 1, ... 23. */
export const hourSlots = (): number[] =>
  Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

/** Pixel height of one full day. */
export const gridHeightPx = (): number => (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;

/** Minutes since midnight -> pixels from the top of the grid, clamped to the day. */
export const minuteToPx = (min: number): number => {
  const clamped = Math.min(Math.max(min, DAY_START_MIN), DAY_END_MIN);
  return ((clamped - DAY_START_MIN) / 60) * HOUR_PX;
};

/** Top offset for an assignment starting at `fromMin`. */
export const slotTopPx = (fromMin: number): number => Math.max(0, minuteToPx(fromMin));

/** Height for an assignment; always at least MIN_SLOT_PX so short tasks stay readable. */
export const slotHeightPx = (fromMin: number, toMin: number): number => {
  const start = Math.min(Math.max(fromMin, DAY_START_MIN), DAY_END_MIN);
  const end = Math.min(Math.max(toMin, start), DAY_END_MIN);
  return Math.max(MIN_SLOT_PX, ((end - start) / 60) * HOUR_PX - 2);
};

/** "00:00" style label for an hour row. */
export const hourLabel = (h: number): string => `${String(h).padStart(2, '0')}:00`;

/** True when a time-of-day in minutes falls inside the visible day. */
export const isWithinDay = (min: number): boolean => min >= DAY_START_MIN && min <= DAY_END_MIN;
