import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  authorizeAbsenceCleanup,
  authorizeCreateRoles,
  authorizeRoleChange,
  decidePushPreference,
  effectivePermission,
  parseAbsenceRequest,
  safeSecretEquals,
  validateCreateUserBody,
  maskEmail,
} from './policies';

const D14 = '00000000-0000-4000-8000-000000000014';
const D03 = '00000000-0000-4000-8000-000000000003';
const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';

describe('staged Edge copy', () => {
  it('is byte-identical to the tested source (no drift)', () => {
    const a = readFileSync(resolve(__dirname, 'policies.ts'), 'utf8');
    const b = readFileSync(resolve(__dirname, '../../../supabase/staged/functions/_shared/policies.ts'), 'utf8');
    expect(b).toBe(a);
  });
});

describe('authorizeRoleChange (admin-user-role)', () => {
  const base = {
    callerId: U1, callerRoles: ['administrator'], callerDeptIds: [D14],
    targetId: U2, targetCurrentRoles: ['servicemedarbejder'], targetDeptIds: [D14],
  };
  it('administrator cannot grant super_admin', () => {
    expect(authorizeRoleChange({ ...base, requestedRoles: ['super_admin'] })).toEqual({ ok: false, status: 403, code: 'super_admin_required' });
  });
  it('administrator cannot make themselves super_admin', () => {
    expect(authorizeRoleChange({ ...base, targetId: U1, targetCurrentRoles: ['administrator'], requestedRoles: ['administrator', 'super_admin'] }).ok).toBe(false);
  });
  it('administrator cannot modify an existing super_admin', () => {
    expect(authorizeRoleChange({ ...base, targetCurrentRoles: ['super_admin'], requestedRoles: ['vikar'] })).toMatchObject({ ok: false, code: 'super_admin_required' });
  });
  it('administrator in another department is denied', () => {
    expect(authorizeRoleChange({ ...base, targetDeptIds: [D03], requestedRoles: ['skadeleder'] })).toMatchObject({ ok: false, code: 'wrong_department' });
  });
  it('administrator may set allowed roles in own department (incl. multi-role)', () => {
    expect(authorizeRoleChange({ ...base, requestedRoles: ['skadeleder', 'fugttekniker'] })).toEqual({ ok: true });
  });
  it('administrator may set roles on a fresh user without department', () => {
    expect(authorizeRoleChange({ ...base, targetDeptIds: [], requestedRoles: ['vikar'] })).toEqual({ ok: true });
  });
  it('super_admin may grant and remove super_admin anywhere', () => {
    expect(authorizeRoleChange({ ...base, callerRoles: ['super_admin'], callerDeptIds: [], targetDeptIds: [D03], requestedRoles: ['super_admin'] })).toEqual({ ok: true });
    expect(authorizeRoleChange({ ...base, callerRoles: ['super_admin'], targetCurrentRoles: ['super_admin'], requestedRoles: ['administrator'] })).toEqual({ ok: true });
  });
  it('skadeleder / servicemedarbejder are denied', () => {
    expect(authorizeRoleChange({ ...base, callerRoles: ['skadeleder'], requestedRoles: ['vikar'] })).toMatchObject({ ok: false, status: 403 });
  });
  it('unknown or empty roles are rejected', () => {
    expect(authorizeRoleChange({ ...base, requestedRoles: ['root'] })).toMatchObject({ ok: false, status: 400 });
    expect(authorizeRoleChange({ ...base, requestedRoles: [] })).toMatchObject({ ok: false, status: 400 });
  });
});

describe('admin-create-user validation and roles', () => {
  it('administrator cannot create super_admin; super_admin can', () => {
    expect(authorizeCreateRoles(['administrator'], ['super_admin'])).toMatchObject({ ok: false, status: 403 });
    expect(authorizeCreateRoles(['super_admin'], ['super_admin'])).toEqual({ ok: true });
    expect(authorizeCreateRoles(['skadeleder'], ['vikar'])).toMatchObject({ ok: false, status: 403 });
  });
  it('rejects invalid phone BEFORE the auth user is created', () => {
    expect(validateCreateUserBody({ name: 'A', email: 'a@b.dk', password: 'x', userData: { phone: 'abc-not-phone' } })).toEqual({ ok: false, code: 'phone_invalid' });
  });
  it('requires email+password for non-temporary users, not for vikarer', () => {
    expect(validateCreateUserBody({ name: 'A' })).toEqual({ ok: false, code: 'email_password_required' });
    expect(validateCreateUserBody({ name: 'A', userData: { is_temporary: true }, roles: ['vikar'] }).ok).toBe(true);
  });
  it('rejects unknown roles', () => {
    expect(validateCreateUserBody({ name: 'A', email: 'a@b.dk', password: 'x', roles: ['owner'] })).toEqual({ ok: false, code: 'invalid_roles' });
  });
});

describe('vacation-cleanup-assignments authorization', () => {
  const t = { callerCanApproveVacations: false, callerDeptIds: [D14], targetDeptIds: [D14] };
  it('ordinary servicemedarbejder cannot unassign a colleague', () => {
    for (const reason of ['approved_vacation', 'sick', 'training', 'on_leave'] as const) {
      expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['servicemedarbejder'], reason }).ok).toBe(false);
    }
  });
  it('vikar is denied', () => {
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['vikar'], reason: 'approved_vacation' }).ok).toBe(false);
  });
  it('administrator in a different department is denied', () => {
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['administrator'], targetDeptIds: [D03], reason: 'sick' })).toMatchObject({ ok: false, code: 'wrong_department' });
  });
  it('approve_vacations grant allows approved vacation cleanup only', () => {
    const c = { ...t, callerRoles: ['servicemedarbejder'], callerCanApproveVacations: true };
    expect(authorizeAbsenceCleanup({ ...c, reason: 'approved_vacation' })).toEqual({ ok: true });
    expect(authorizeAbsenceCleanup({ ...c, reason: 'sick' }).ok).toBe(false);
  });
  it('sick is administrator-only; skadeleder may do training', () => {
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['skadeleder'], reason: 'sick' }).ok).toBe(false);
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['administrator'], reason: 'sick' })).toEqual({ ok: true });
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['skadeleder'], reason: 'training' })).toEqual({ ok: true });
  });
  it('super_admin is allowed across departments', () => {
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: ['super_admin'], callerDeptIds: [], targetDeptIds: [D03], reason: 'sick' })).toEqual({ ok: true });
  });
  it('impersonated role in body is irrelevant — only caller roles count', () => {
    // A body claiming {role:'administrator'} is never read; only JWT-derived roles are passed in.
    expect(authorizeAbsenceCleanup({ ...t, callerRoles: [], reason: 'approved_vacation' }).ok).toBe(false);
  });
});

describe('parseAbsenceRequest', () => {
  it('rejects approved_vacation without vacationId (status must be verified)', () => {
    expect(parseAbsenceRequest({ userId: U1, startDate: '2026-11-02', endDate: '2026-11-02', reason: 'approved_vacation' })).toEqual({ ok: false, code: 'invalid_reason' });
  });
  it('rejects bad / reversed / huge / impossible dates', () => {
    expect(parseAbsenceRequest({ userId: U1, startDate: '2026-11-05', endDate: '2026-11-02', reason: 'sick' }).ok).toBe(false);
    expect(parseAbsenceRequest({ userId: U1, startDate: '2026-02-30', endDate: '2026-03-01', reason: 'sick' }).ok).toBe(false);
    expect(parseAbsenceRequest({ userId: U1, startDate: '2020-01-01', endDate: '2026-01-01', reason: 'training' })).toEqual({ ok: false, code: 'range_too_large' });
  });
  it('rejects non-uuid ids', () => {
    expect(parseAbsenceRequest({ vacationId: "1' or 1=1" })).toEqual({ ok: false, code: 'invalid_vacation_id' });
  });
  it('accepts legitimate sick and vacation requests', () => {
    expect(parseAbsenceRequest({ userId: U1, startDate: '2026-11-02', endDate: '2026-11-02', reason: 'sick' }).ok).toBe(true);
    expect(parseAbsenceRequest({ vacationId: U2 }).ok).toBe(true);
  });
});

describe('effectivePermission (deny precedence)', () => {
  it('personal Fra overrides a role grant', () => {
    expect(effectivePermission({ isSuperAdmin: false, roleAllows: true, personal: false })).toBe(false);
  });
  it('personal Til adds; no override follows role', () => {
    expect(effectivePermission({ isSuperAdmin: false, roleAllows: false, personal: true })).toBe(true);
    expect(effectivePermission({ isSuperAdmin: false, roleAllows: true, personal: null })).toBe(true);
    expect(effectivePermission({ isSuperAdmin: false, roleAllows: false, personal: undefined })).toBe(false);
  });
  it('super_admin is never restricted', () => {
    expect(effectivePermission({ isSuperAdmin: true, roleAllows: false, personal: false })).toBe(true);
  });
});

describe('push preference decision', () => {
  it('DB error => unknown (must not send)', () => {
    expect(decidePushPreference(null, { message: 'timeout' }, 'duty')).toBe('unknown');
  });
  it('missing row => default allow; explicit false => deny', () => {
    expect(decidePushPreference(null, null, 'duty')).toBe('allow');
    expect(decidePushPreference({ duty: false }, null, 'duty')).toBe('deny');
    expect(decidePushPreference({ duty: true }, null, 'duty')).toBe('allow');
  });
});

describe('secrets and log hygiene', () => {
  it('missing expected secret fails closed', () => {
    expect(safeSecretEquals('', '')).toBe(false);
    expect(safeSecretEquals(undefined, 'x')).toBe(false);
    expect(safeSecretEquals('abc', 'abd')).toBe(false);
    expect(safeSecretEquals('abc', 'abc')).toBe(true);
  });
  it('masks e-mail', () => {
    expect(maskEmail('kasper@polygon.dk')).toBe('k***@polygon.dk');
  });
});
