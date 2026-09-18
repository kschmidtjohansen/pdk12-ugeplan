export interface ProximityRankingDay {
  date: string;
  absent: boolean;
  assignmentCount: number;
  hasEnoughFree: boolean;
  originDistanceKm: number | null;
  origin: 'assignment' | 'home' | null;
}

export interface TimedAssignment {
  id: string;
  toTime?: string | null;
}

/** Selects the last-ending assignment consistently when a day has several. */
export const selectLastAssignment = <T extends TimedAssignment>(assignments: T[]): T | undefined =>
  [...assignments].sort((a, b) => {
    const byEndTime = (a.toTime ?? '').localeCompare(b.toTime ?? '');
    return byEndTime !== 0 ? byEndTime : a.id.localeCompare(b.id);
  }).at(-1);

const byDistanceThenDate = <T extends ProximityRankingDay>(a: T, b: T) => {
  const distanceA = a.originDistanceKm ?? Number.POSITIVE_INFINITY;
  const distanceB = b.originDistanceKm ?? Number.POSITIVE_INFINITY;
  if (distanceA !== distanceB) return distanceA - distanceB;
  return a.date.localeCompare(b.date);
};

/**
 * Selects the single day that owns an employee's headline distance.
 * Today is authoritative when it belongs to the displayed week. For other
 * weeks, real assignment positions take precedence over every home position.
 */
export const selectProximityRankingDay = <T extends ProximityRankingDay>(
  days: T[],
  today: string
): T | null => {
  const todayEntry = days.find((day) => day.date === today);
  if (todayEntry) {
    return todayEntry.originDistanceKm !== null ? todayEntry : null;
  }

  const hasAssignmentsInWeek = days.some((day) => day.assignmentCount > 0);
  if (hasAssignmentsInWeek) {
    return [...days]
      .filter((day) => day.origin === 'assignment' && day.originDistanceKm !== null)
      .sort(byDistanceThenDate)[0] ?? null;
  }

  return [...days]
    .filter((day) => day.origin === 'home' && day.originDistanceKm !== null)
    .sort(byDistanceThenDate)[0] ?? null;
};