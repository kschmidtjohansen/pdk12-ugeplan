import { describe, expect, it } from 'vitest';
import { scanRoleHasAccess, SCANS_URL } from './useScanAccess';

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
  it('points at the static page, not a React route', () => {
    expect(SCANS_URL).toBe('/3d/index.html');
  });
});
