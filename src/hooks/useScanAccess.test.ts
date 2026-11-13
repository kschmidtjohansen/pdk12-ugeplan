import { describe, expect, it } from 'vitest';
import { scanRoleHasAccess, SCANS_URL, SCANS_ROUTE } from './useScanAccess';

describe('scanRoleHasAccess', () => {
  it('gives access to viewer, editor and admin only', () => {
    expect(scanRoleHasAccess('viewer')).toBe(true);
    expect(scanRoleHasAccess('editor')).toBe(true);
    expect(scanRoleHasAccess('admin')).toBe(true);
    expect(scanRoleHasAccess('pending')).toBe(false);
    expect(scanRoleHasAccess(null)).toBe(false);
    expect(scanRoleHasAccess(undefined)).toBe(false);
    expect(scanRoleHasAccess({ role: 'admin' })).toBe(false);
  });
  it('runs the static app inside the PolyPlan page', () => {
    expect(SCANS_URL).toBe('/3d/index.html');
    expect(SCANS_ROUTE).toBe('/3d-scanninger');
  });
});
