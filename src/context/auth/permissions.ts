import type { UserRole } from './types';

/** Extra capabilities IT-Support can grant to a role (stored in role_permissions). */
export const GRANTABLE_PERMISSIONS = [
  'plan_assignments',
  'publish_assignments',
  'view_all_vacations',
  'approve_vacations',
] as const;
export type GrantablePermission = typeof GRANTABLE_PERMISSIONS[number];

export interface DerivedPermissions {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSkadeleder: boolean;
  isServicemedarbejder: boolean;
  isEffectiveAdmin: boolean;
  isEffectiveSkadeleder: boolean;
  isEffectiveServicemedarbejder: boolean;
  canViewFuelCardCode: boolean;
  canPublishTasks: boolean;
  canApproveVacation: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canSeeUnpublishedTasks: boolean;
  /** May approve/reject and administer others' vacation requests. */
  canManageVacations: boolean;
  /** May see every vacation request in the department (overview). */
  canViewAllVacations: boolean;
  canViewWarehouse: boolean;
  canManageWarehouse: boolean;
  canViewDuty: boolean;
  canManageDuty: boolean;
}

/**
 * Pure permission derivation.
 * @param currentRole role the UI renders as (demo/impersonation applied)
 * @param realRole    role of the actually signed-in user
 * @param isDemoMode  demo mode never grants real super_admin rights
 * @param grants      extra permissions granted to currentRole by IT-Support
 */
export function derivePermissions(
  currentRole: UserRole | null | undefined,
  realRole: UserRole | null | undefined,
  isDemoMode: boolean,
  grants: ReadonlySet<string> = new Set(),
  overrides: ReadonlyMap<string, boolean> = new Map(),
): DerivedPermissions {
  const isSuperAdmin = currentRole === 'super_admin';
  const isAdmin = currentRole === 'administrator' || isSuperAdmin;
  const isSkadeleder = currentRole === 'skadeleder';
  const isServicemedarbejder = currentRole === 'servicemedarbejder';
  // IT-Support (real super_admin) keeps full rights even while impersonating.
  const realIsSuperAdmin = !isDemoMode && realRole === 'super_admin';
  // Grants never apply in demo mode.
  const has = (p: GrantablePermission) => !isDemoMode && grants.has(p);
  const editor = isAdmin || isSkadeleder || realIsSuperAdmin;
  const planner = editor || has('plan_assignments');
  const manageVacations = editor || has('approve_vacations');
  // Personal on/off choices per employee win over role defaults.
  // IT-Support (real super_admin, not impersonating someone else) is never restricted.
  const ov = (p: PersonalPermission, base: boolean) => {
    if (isDemoMode || (realIsSuperAdmin && isSuperAdmin)) return base;
    const v = overrides.get(p);
    return v === undefined ? base : v;
  };
  const canPlan = ov('plan_assignments', planner);
  const canManage = ov('approve_vacations', manageVacations);
  return {
    isSuperAdmin,
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    isEffectiveAdmin: isAdmin,
    isEffectiveSkadeleder: isSkadeleder,
    isEffectiveServicemedarbejder: isServicemedarbejder,
    canViewFuelCardCode: ov('view_fuel_codes', isAdmin || realIsSuperAdmin),
    canPublishTasks: ov('publish_assignments', editor || has('publish_assignments')),
    canApproveVacation: ov('approve_vacations', isAdmin || realIsSuperAdmin || has('approve_vacations')),
    canEdit: canPlan,
    canCreate: canPlan,
    canSeeUnpublishedTasks: ov('view_unpublished', planner),
    canManageVacations: canManage,
    canViewAllVacations: ov('view_all_vacations', manageVacations || has('view_all_vacations')),
    canViewWarehouse: ov('view_warehouse', true),
    canManageWarehouse: ov('manage_warehouse', editor),
    canViewDuty: ov('view_duty', true),
    canManageDuty: ov('manage_duty', editor),
  };
}

/** Capabilities that can be switched on/off for one specific employee. */
export const PERSONAL_PERMISSIONS = [
  'plan_assignments',
  'publish_assignments',
  'view_unpublished',
  'view_all_vacations',
  'approve_vacations',
  'view_fuel_codes',
  'view_warehouse',
  'manage_warehouse',
  'view_duty',
  'manage_duty',
] as const;
export type PersonalPermission = typeof PERSONAL_PERMISSIONS[number];
