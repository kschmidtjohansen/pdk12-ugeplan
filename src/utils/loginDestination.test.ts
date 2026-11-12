import { describe, expect, it } from 'vitest';
import { getLoginDestination } from './loginDestination';

describe('login destination', () => {
  it('keeps normal PolyPlan login on the dashboard', () => {
    expect(getLoginDestination('')).toBe('/dashboard');
  });
  it('returns scans login to /3d with its tour and query preserved', () => {
    expect(getLoginDestination('?returnTo=' + encodeURIComponent('/3d?view=dept#t-abc123')))
      .toBe('/3d?view=dept#t-abc123');
  });
  it('rejects external and unrelated destinations', () => {
    for (const target of ['https://evil.invalid/3d', '//evil.invalid/3d', '/admin', '/3d/index.html', '/\\evil.invalid/3d']) {
      expect(getLoginDestination('?returnTo=' + encodeURIComponent(target))).toBe('/dashboard');
    }
  });
});