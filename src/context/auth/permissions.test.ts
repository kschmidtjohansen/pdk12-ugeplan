import { describe, it, expect } from 'vitest';
import { derivePermissions } from './permissions';

describe('derivePermissions (role access)', () => {
  it('administrator can do everything except being super admin', () => {
    const p = derivePermissions('administrator', 'administrator', false);
    expect(p).toMatchObject({ isAdmin: true, isSuperAdmin: false, canApproveVacation: true, canViewFuelCardCode: true, canEdit: true });
  });
  it('skadeleder can edit/publish but not approve vacation or see fuel codes', () => {
    const p = derivePermissions('skadeleder', 'skadeleder', false);
    expect(p).toMatchObject({ canEdit: true, canPublishTasks: true, canApproveVacation: false, canViewFuelCardCode: false });
  });
  it.each(['servicemedarbejder', 'fugttekniker', 'vikar'] as const)('%s is read-only', role => {
    const p = derivePermissions(role, role, false);
    expect(p).toMatchObject({ canEdit: false, canCreate: false, canApproveVacation: false, canSeeUnpublishedTasks: false });
  });
  it('IT-Support impersonating a vikar keeps full rights', () => {
    const p = derivePermissions('vikar', 'super_admin', false);
    expect(p).toMatchObject({ isAdmin: false, canEdit: true, canApproveVacation: true, canViewFuelCardCode: true });
  });
  it('demo mode never grants real super admin rights', () => {
    expect(derivePermissions('vikar', 'super_admin', true).canEdit).toBe(false);
  });
  it('no role means no access', () => {
    expect(derivePermissions(null, null, false).canEdit).toBe(false);
  });
});
