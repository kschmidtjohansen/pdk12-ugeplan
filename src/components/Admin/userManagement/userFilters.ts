import type { UserRole } from '@/context/AuthContext';
import { getEffectiveRole, sortRolesByRank } from '@/utils/roleHierarchy';
import type { AdminUser } from '../UserTableRow';
import type { UserStatusFilter } from '../UserListToolbar';

export const DEMO_USER_EMAIL = 'test@polygongroup.com';
export const DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';

export interface UserAccessRow { user_id: string; department_id: string }

export const isUserActive = (user: AdminUser, now: Date = new Date()): boolean =>
  !user.banned_until || new Date(user.banned_until) <= now;

export const sortUsersByName = (list: AdminUser[], direction: 'asc' | 'desc'): AdminUser[] =>
  [...list].sort((a, b) => {
    const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    return direction === 'asc' ? cmp : -cmp;
  });

/**
 * Department filter. `departmentFilter` is 'current', 'unassigned' or a department id.
 * The demo account is hidden unless the viewer is in demo mode.
 */
export function filterUsersByDepartment(
  users: AdminUser[],
  access: UserAccessRow[],
  departmentFilter: string,
  selectedDepartmentId: string | null | undefined,
  isDemoMode: boolean,
): AdminUser[] {
  if (!users.length) return [];
  const base = isDemoMode ? users : users.filter(u => u.email !== DEMO_USER_EMAIL && u.id !== DEMO_USER_ID);

  if (departmentFilter === 'unassigned') {
    const withAccess = new Set(access.map(a => a.user_id));
    return base.filter(u => !withAccess.has(u.id));
  }
  const deptId = departmentFilter === 'current' ? selectedDepartmentId : departmentFilter;
  if (!deptId) return base;
  const inDept = new Set(access.filter(a => a.department_id === deptId).map(a => a.user_id));
  return base.filter(u => inDept.has(u.id));
}

/** Search (name/email, already lower-cased term) + role + status filters. */
export function searchUsers(
  users: AdminUser[],
  searchTerm: string,
  roleFilter: UserRole[],
  statusFilter: UserStatusFilter,
): AdminUser[] {
  return users.filter(u => {
    if (searchTerm && !`${u.name || ''} ${u.email || ''}`.toLowerCase().includes(searchTerm)) return false;
    if (roleFilter.length > 0 && !roleFilter.includes(u.role)) return false;
    if (statusFilter === 'active' && !isUserActive(u)) return false;
    if (statusFilter === 'inactive' && isUserActive(u)) return false;
    return true;
  });
}

export const countRoles = (users: AdminUser[]): Partial<Record<UserRole, number>> =>
  users.reduce<Partial<Record<UserRole, number>>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  job_title?: string | null;
  on_leave?: boolean | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  role?: string | null;
}

export const mapProfileToAdminUser = (p: ProfileRow, role?: string | null): AdminUser => ({
  id: p.id,
  email: p.email,
  name: p.name,
  phone: p.phone,
  jobTitle: p.job_title,
  role: (role || p.role || 'servicemedarbejder') as UserRole,
  created_at: p.created_at,
  updated_at: p.updated_at,
  last_sign_in_at: null,
  banned_until: null,
  onLeave: p.on_leave || false,
  notes: p.notes,
} as AdminUser);
