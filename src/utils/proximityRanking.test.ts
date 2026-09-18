import { describe, expect, it } from 'vitest';
import { selectProximityRankingDay, ProximityRankingDay } from './proximityRanking';

const day = (overrides: Partial<ProximityRankingDay>): ProximityRankingDay => ({
  date: '2026-09-18',
  absent: false,
  assignmentCount: 0,
  hasEnoughFree: true,
  originDistanceKm: 20,
  origin: 'home',
  ...overrides,
});

describe('selectProximityRankingDay', () => {
  it('uses today’s assignment instead of another weekday’s home address', () => {
    const result = selectProximityRankingDay([
      day({ date: '2026-09-17', origin: 'home', originDistanceKm: 2 }),
      day({
        date: '2026-09-18',
        assignmentCount: 2,
        origin: 'assignment',
        originDistanceKm: 0.8,
      }),
    ], '2026-09-18');

    expect(result?.origin).toBe('assignment');
    expect(result?.originDistanceKm).toBe(0.8);
  });

  it('uses home today only when the employee has no assignment today', () => {
    const result = selectProximityRankingDay([
      day({ date: '2026-09-18', origin: 'home', originDistanceKm: 7 }),
    ], '2026-09-18');

    expect(result?.origin).toBe('home');
  });

  it('does not replace an unresolved booked day with home', () => {
    const result = selectProximityRankingDay([
      day({
        date: '2026-09-18',
        assignmentCount: 1,
        origin: null,
        originDistanceKm: null,
      }),
      day({ date: '2026-09-17', origin: 'home', originDistanceKm: 1 }),
    ], '2026-09-18');

    expect(result).toBeNull();
  });

  it('uses the nearest real assignment in a non-current week', () => {
    const result = selectProximityRankingDay([
      day({ date: '2026-09-21', assignmentCount: 1, origin: 'assignment', originDistanceKm: 12 }),
      day({ date: '2026-09-22', assignmentCount: 1, origin: 'assignment', originDistanceKm: 4 }),
      day({ date: '2026-09-23', origin: 'home', originDistanceKm: 1 }),
    ], '2026-09-18');

    expect(result?.date).toBe('2026-09-22');
    expect(result?.origin).toBe('assignment');
  });

  it('uses home in a non-current week only when there are no assignments', () => {
    const result = selectProximityRankingDay([
      day({ date: '2026-09-21', origin: 'home', originDistanceKm: 9 }),
      day({ date: '2026-09-22', origin: 'home', originDistanceKm: 3 }),
    ], '2026-09-18');

    expect(result?.originDistanceKm).toBe(3);
  });
});