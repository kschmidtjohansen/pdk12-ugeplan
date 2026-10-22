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

describe('role grants from IT-Support', () => {
  it.each(['administrator', 'skadeleder', 'super_admin'] as const)('existing %s planning access survives an empty grants list', role => {
    const p = derivePermissions(role, role, false, new Set());
    expect(p.canCreate).toBe(true);
    expect(p.canEdit).toBe(true);
    expect(p.canPublishTasks).toBe(true);
  });
  it('servicemedarbejder with plan + vacation grants can plan and see all vacations', () => {
    const p = derivePermissions('servicemedarbejder', 'servicemedarbejder', false, new Set(['plan_assignments', 'view_all_vacations']));
    expect(p.canCreate).toBe(true);
    expect(p.canEdit).toBe(true);
    expect(p.canViewAllVacations).toBe(true);
    expect(p.canManageVacations).toBe(false);
    expect(p.canPublishTasks).toBe(false);
  });
  it('servicemedarbejder without grants keeps normal access only', () => {
    const p = derivePermissions('servicemedarbejder', 'servicemedarbejder', false);
    expect(p.canCreate).toBe(false);
    expect(p.canViewAllVacations).toBe(false);
  });
  it('grants never apply in demo mode', () => {
    const p = derivePermissions('servicemedarbejder', 'servicemedarbejder', true, new Set(['plan_assignments']));
    expect(p.canCreate).toBe(false);
  });
});
