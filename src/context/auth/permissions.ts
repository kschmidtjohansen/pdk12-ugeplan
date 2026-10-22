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
  return {
    isSuperAdmin,
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    isEffectiveAdmin: isAdmin,
    isEffectiveSkadeleder: isSkadeleder,
    isEffectiveServicemedarbejder: isServicemedarbejder,
    canViewFuelCardCode: isAdmin || realIsSuperAdmin,
    canPublishTasks: editor || has('publish_assignments'),
    canApproveVacation: isAdmin || realIsSuperAdmin || has('approve_vacations'),
    canEdit: planner,
    canCreate: planner,
    canSeeUnpublishedTasks: planner,
    canManageVacations: manageVacations,
    canViewAllVacations: manageVacations || has('view_all_vacations'),
  };
}
