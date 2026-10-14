import type { UserRole } from './types';

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
}

/**
 * Pure permission derivation.
 * @param currentRole role the UI renders as (demo/impersonation applied)
 * @param realRole    role of the actually signed-in user
 * @param isDemoMode  demo mode never grants real super_admin rights
 */
export function derivePermissions(
  currentRole: UserRole | null | undefined,
  realRole: UserRole | null | undefined,
  isDemoMode: boolean,
): DerivedPermissions {
  const isSuperAdmin = currentRole === 'super_admin';
  const isAdmin = currentRole === 'administrator' || isSuperAdmin;
  const isSkadeleder = currentRole === 'skadeleder';
  const isServicemedarbejder = currentRole === 'servicemedarbejder';
  // IT-Support (real super_admin) keeps full rights even while impersonating.
  const realIsSuperAdmin = !isDemoMode && realRole === 'super_admin';
  const editor = isAdmin || isSkadeleder || realIsSuperAdmin;
  return {
    isSuperAdmin,
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    isEffectiveAdmin: isAdmin,
    isEffectiveSkadeleder: isSkadeleder,
    isEffectiveServicemedarbejder: isServicemedarbejder,
    canViewFuelCardCode: isAdmin || realIsSuperAdmin,
    canPublishTasks: editor,
    canApproveVacation: isAdmin || realIsSuperAdmin,
    canEdit: editor,
    canCreate: editor,
    canSeeUnpublishedTasks: editor,
  };
}
