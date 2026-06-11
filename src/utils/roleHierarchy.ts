import type { UserRole } from '@/context/AuthContext';

// Higher number = more privileged. Used to derive a single "effective" role
// for a user that holds multiple roles (e.g. Skadeleder + Fugttekniker).
export const ROLE_RANK: Record<UserRole, number> = {
  super_admin: 60,
  administrator: 50,
  skadeleder: 40,
  fugttekniker: 30,
  servicemedarbejder: 20,
  vikar: 10,
};

export const ALL_ASSIGNABLE_ROLES: UserRole[] = [
  'super_admin',
  'administrator',
  'skadeleder',
  'fugttekniker',
  'servicemedarbejder',
  'vikar',
];

/** Return the most privileged role from a list. Falls back to 'servicemedarbejder'. */
export function getEffectiveRole(roles: (UserRole | null | undefined)[] | null | undefined): UserRole {
  if (!roles || roles.length === 0) return 'servicemedarbejder';
  const clean = roles.filter(Boolean) as UserRole[];
  if (clean.length === 0) return 'servicemedarbejder';
  return clean.reduce((best, r) =>
    (ROLE_RANK[r] ?? 0) > (ROLE_RANK[best] ?? 0) ? r : best,
  clean[0]);
}

/** Sort roles from highest to lowest privilege (stable for display). */
export function sortRolesByRank(roles: UserRole[]): UserRole[] {
  return [...roles].sort((a, b) => (ROLE_RANK[b] ?? 0) - (ROLE_RANK[a] ?? 0));
}
