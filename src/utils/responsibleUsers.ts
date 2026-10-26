import type { Employee } from '@/types/employee';

const RESPONSIBLE_ROLES = new Set(['super_admin', 'administrator', 'skadeleder']);

/** A person may be case manager (sagsansvarlig) if any of their roles is skadeleder/admin. */
export function isEligibleResponsibleUser(emp: Pick<Employee, 'role' | 'roles'>): boolean {
  const roles: string[] = [emp.role, ...((emp.roles as string[] | undefined) ?? [])];
  return roles.some(r => RESPONSIBLE_ROLES.has(r));
}
