/**
 * Pure, dependency-free authorization policies for PolyPlan Edge Functions.
 *
 * This file is the single source of truth. A byte-identical copy lives in
 * `supabase/staged/functions/_shared/policies.ts` (enforced by a test) so the
 * staged Edge Functions can import it once they are rolled out manually.
 * Do NOT import anything here — it must run unchanged in Deno and Vitest.
 */

export const ALL_ROLES = [
  'super_admin',
  'administrator',
  'skadeleder',
  'fugttekniker',
  'servicemedarbejder',
  'vikar',
] as const;
export type AppRole = (typeof ALL_ROLES)[number];

/** Roles an administrator (non super_admin) may assign or remove. */
export const ADMIN_ASSIGNABLE_ROLES: readonly AppRole[] = [
  'administrator',
  'skadeleder',
  'fugttekniker',
  'servicemedarbejder',
  'vikar',
];

export type Decision = { ok: true } | { ok: false; status: number; code: string };
const allow: Decision = { ok: true };
const deny = (status: number, code: string): Decision => ({ ok: false, status, code });

export function isKnownRole(r: unknown): r is AppRole {
  return typeof r === 'string' && (ALL_ROLES as readonly string[]).includes(r);
}

export function sharesDepartment(a: readonly string[], b: readonly string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const set = new Set(a);
  return b.some((d) => set.has(d));
}

/**
 * Role replacement (admin-user-role).
 * - super_admin caller: any known roles.
 * - administrator caller: only ADMIN_ASSIGNABLE_ROLES, never touches a target that
 *   currently holds super_admin, and the target must share a department with the
 *   caller (or have no department yet — freshly created user).
 * - everyone else: denied.
 */
export function authorizeRoleChange(input: {
  callerId: string;
  callerRoles: readonly string[];
  callerDeptIds: readonly string[];
  targetId: string;
  targetCurrentRoles: readonly string[];
  targetDeptIds: readonly string[];
  requestedRoles: readonly unknown[];
}): Decision {
  const requested = input.requestedRoles;
  if (requested.length === 0 || requested.length > ALL_ROLES.length) return deny(400, 'invalid_roles');
  if (!requested.every(isKnownRole)) return deny(400, 'invalid_roles');

  if (input.callerRoles.includes('super_admin')) return allow;
  if (!input.callerRoles.includes('administrator')) return deny(403, 'admin_required');

  if (requested.includes('super_admin')) return deny(403, 'super_admin_required');
  if (input.targetCurrentRoles.includes('super_admin')) return deny(403, 'super_admin_required');
  if (!requested.every((r) => ADMIN_ASSIGNABLE_ROLES.includes(r as AppRole))) {
    return deny(403, 'role_not_assignable');
  }
  // An administrator may not strip their own administrator role by accident.
  if (input.callerId === input.targetId && !requested.includes('administrator')) {
    return deny(403, 'cannot_demote_self');
  }
  if (input.targetDeptIds.length > 0 && !sharesDepartment(input.callerDeptIds, input.targetDeptIds)) {
    return deny(403, 'wrong_department');
  }
  return allow;
}

/** User creation (admin-create-user): role part only. */
export function authorizeCreateRoles(callerRoles: readonly string[], requested: readonly unknown[]): Decision {
  if (!requested.every(isKnownRole)) return deny(400, 'invalid_roles');
  if (callerRoles.includes('super_admin')) return allow;
  if (!callerRoles.includes('administrator')) return deny(403, 'admin_required');
  if (!requested.every((r) => ADMIN_ASSIGNABLE_ROLES.includes(r as AppRole))) {
    return deny(403, 'super_admin_required');
  }
  return allow;
}

export const PHONE_PATTERN = /^\+?[0-9\s\-()]{8,}$/;

export type CreateUserInput = {
  name: string;
  email: string | null;
  password: string | null;
  isTemporary: boolean;
  phone: string | null;
  roles: AppRole[];
};

/** Validate everything BEFORE an auth user is created. */
export function validateCreateUserBody(body: unknown): { ok: true; value: CreateUserInput } | { ok: false; code: string } {
  if (!body || typeof body !== 'object') return { ok: false, code: 'invalid_body' };
  const b = body as Record<string, unknown>;
  const userData = (b.userData && typeof b.userData === 'object' ? b.userData : {}) as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name || name.length > 200) return { ok: false, code: 'name_required' };
  const isTemporary = userData.is_temporary === true;
  const email = typeof b.email === 'string' && b.email.trim() ? b.email.trim().toLowerCase() : null;
  const password = typeof b.password === 'string' && b.password ? b.password : null;
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { ok: false, code: 'email_invalid' };
  if (!isTemporary && (!email || !password)) return { ok: false, code: 'email_password_required' };
  let phone: string | null = null;
  if (typeof userData.phone === 'string' && userData.phone.trim().length >= 3) {
    const t = userData.phone.trim();
    if (!PHONE_PATTERN.test(t)) return { ok: false, code: 'phone_invalid' };
    phone = t;
  }
  const rawRoles = Array.isArray(b.roles) && b.roles.length > 0 ? b.roles : b.role ? [b.role] : [];
  if (!rawRoles.every(isKnownRole)) return { ok: false, code: 'invalid_roles' };
  return { ok: true, value: { name, email, password, isTemporary, phone, roles: Array.from(new Set(rawRoles)) } };
}

// ---------------------------------------------------------------------------
// Absence cleanup (vacation-cleanup-assignments)
// ---------------------------------------------------------------------------

export type AbsenceReason = 'approved_vacation' | 'on_leave' | 'training' | 'sick';
const ABSENCE_REASONS: readonly AbsenceReason[] = ['approved_vacation', 'on_leave', 'training', 'sick'];
export const MAX_ABSENCE_SPAN_DAYS = 366;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function daySpan(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === 'string' && UUID_RE.test(s);

export type AbsenceRequest =
  | { mode: 'vacation'; vacationId: string }
  | { mode: 'direct'; userId: string; startDate: string; endDate: string; reason: Exclude<AbsenceReason, 'approved_vacation'> };

export function parseAbsenceRequest(body: unknown): { ok: true; value: AbsenceRequest } | { ok: false; code: string } {
  if (!body || typeof body !== 'object') return { ok: false, code: 'invalid_body' };
  const b = body as Record<string, unknown>;
  if (b.vacationId !== undefined) {
    if (!isUuid(b.vacationId)) return { ok: false, code: 'invalid_vacation_id' };
    return { ok: true, value: { mode: 'vacation', vacationId: b.vacationId } };
  }
  if (!isUuid(b.userId)) return { ok: false, code: 'invalid_user_id' };
  if (!isIsoDate(b.startDate) || !isIsoDate(b.endDate)) return { ok: false, code: 'invalid_dates' };
  if (b.endDate < b.startDate) return { ok: false, code: 'invalid_dates' };
  if (daySpan(b.startDate, b.endDate) > MAX_ABSENCE_SPAN_DAYS) return { ok: false, code: 'range_too_large' };
  const reason = b.reason ?? 'on_leave';
  if (!ABSENCE_REASONS.includes(reason as AbsenceReason) || reason === 'approved_vacation') {
    // approved_vacation must go through vacationId so status is verified server-side.
    return { ok: false, code: 'invalid_reason' };
  }
  return { ok: true, value: { mode: 'direct', userId: b.userId, startDate: b.startDate, endDate: b.endDate, reason: reason as 'sick' | 'training' | 'on_leave' } };
}

/**
 * Who may remove a colleague from assignments because of an absence.
 * Always based on the REAL JWT caller (impersonation "Ager som" is client-only
 * and therefore cannot widen this).
 * - super_admin: always.
 * - approved vacation: administrator / skadeleder or the approve_vacations grant
 *   (role grant or personal "Til", not overridden by personal "Fra"), in a shared department.
 * - sick: administrator only (business rule: sick leave is admin-only), shared department.
 * - training / on_leave: administrator / skadeleder, shared department.
 * The caller never needs to be the target; a target cannot use this to edit others.
 */
export function authorizeAbsenceCleanup(input: {
  callerRoles: readonly string[];
  callerCanApproveVacations: boolean;
  callerDeptIds: readonly string[];
  targetDeptIds: readonly string[];
  reason: AbsenceReason;
}): Decision {
  const roles = input.callerRoles;
  if (roles.includes('super_admin')) return allow;
  let roleOk = false;
  switch (input.reason) {
    case 'approved_vacation':
      roleOk = roles.includes('administrator') || roles.includes('skadeleder') || input.callerCanApproveVacations;
      break;
    case 'sick':
      roleOk = roles.includes('administrator');
      break;
    case 'training':
    case 'on_leave':
      roleOk = roles.includes('administrator') || roles.includes('skadeleder');
      break;
  }
  if (!roleOk) return deny(403, 'forbidden');
  if (!sharesDepartment(input.callerDeptIds, input.targetDeptIds)) return deny(403, 'wrong_department');
  return allow;
}

// ---------------------------------------------------------------------------
// Effective permissions (role grant / personal Til / personal Fra)
// ---------------------------------------------------------------------------

/**
 * Deny precedence: an explicit personal "Fra" (granted=false) always wins over a
 * role grant or role default; personal "Til" adds; otherwise the role decides.
 * super_admin is never restricted.
 */
export function effectivePermission(input: {
  isSuperAdmin: boolean;
  roleAllows: boolean;
  personal: boolean | null | undefined;
}): boolean {
  if (input.isSuperAdmin) return true;
  if (input.personal === false) return false;
  if (input.personal === true) return true;
  return input.roleAllows;
}

// ---------------------------------------------------------------------------
// Push preferences
// ---------------------------------------------------------------------------

export type PreferenceDecision = 'allow' | 'deny' | 'unknown';

/**
 * Missing row => defaults (allow). Lookup error => 'unknown' (caller must NOT send;
 * record as deferred/failed so it can be retried). Explicit false => deny.
 */
export function decidePushPreference(
  row: Record<string, unknown> | null | undefined,
  error: unknown,
  category: string,
): PreferenceDecision {
  if (error) return 'unknown';
  if (!row) return 'allow';
  return row[category] === false ? 'deny' : 'allow';
}

// ---------------------------------------------------------------------------
// Shared secret comparison (cron / trigger headers)
// ---------------------------------------------------------------------------

/** Constant-time string compare. Missing expected secret always fails closed. */
export function safeSecretEquals(expected: string | null | undefined, provided: string | null | undefined): boolean {
  if (!expected || !provided) return false;
  const len = Math.max(expected.length, provided.length);
  let diff = expected.length ^ provided.length;
  for (let i = 0; i < len; i++) {
    diff |= (expected.charCodeAt(i) || 0) ^ (provided.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Mask an e-mail for logs: "k***@example.dk". */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}
