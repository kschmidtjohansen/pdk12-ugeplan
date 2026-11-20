import { describe, expect, it } from 'vitest';
import { formatDrive } from './useDriveEstimates';

describe('formatDrive', () => {
  it('viser skønnet køretid og afstand', () => {
    expect(formatDrive({ fromAssignmentId: 'a', distanceKm: 11.1, durationMin: 17 }, true)).toBe('ca. 17 min i bil · 11 km');
    expect(formatDrive({ fromAssignmentId: 'a', distanceKm: 4.25, durationMin: 12 }, true)).toBe('ca. 12 min i bil · 4,3 km');
    expect(formatDrive({ fromAssignmentId: 'a', distanceKm: 4.25, durationMin: 12 }, false)).toBe('approx. 12 min drive · 4.3 km');
  });
  it('siger samme sted, når der ikke skal køres', () => {
    expect(formatDrive({ fromAssignmentId: 'a', distanceKm: 0.1, durationMin: 0 }, true)).toBe('Samme sted som forrige');
  });
});
