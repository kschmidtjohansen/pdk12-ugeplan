// Centralized role helpers. Super Admin always counts as an Administrator.
export type Role = string | null | undefined;

export const isSuperAdminRole = (role: Role): boolean => role === 'super_admin';
export const isAdminRole = (role: Role): boolean =>
  role === 'administrator' || role === 'super_admin';
export const isAdminOrSkadelederRole = (role: Role): boolean =>
  isAdminRole(role) || role === 'skadeleder';
