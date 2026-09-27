import type { Employee } from '@/types/employee';

export const TEMP_EXPIRY_WARNING_DAYS = 3;

/** Days until a temporary employee expires (0 = expires today). null if not a vikar/no date or already expired. */
export const getTempDaysLeft = (emp: Pick<Employee, 'is_temporary' | 'expires_at'> | null | undefined): number | null => {
  if (!emp?.is_temporary || !emp.expires_at) return null;
  const exp = new Date(emp.expires_at);
  if (isNaN(exp.getTime())) return null;
  exp.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((exp.getTime() - today.getTime()) / 86_400_000);
  return days < 0 ? null : days;
};

export const isTempExpiringSoon = (emp: Pick<Employee, 'is_temporary' | 'expires_at'> | null | undefined) => {
  const d = getTempDaysLeft(emp);
  return d !== null && d <= TEMP_EXPIRY_WARNING_DAYS;
};

export const expiryLabel = (days: number, isDa: boolean) =>
  isDa
    ? days === 0 ? 'Udløber i dag' : days === 1 ? 'Udløber i morgen' : `Udløber om ${days} dage`
    : days === 0 ? 'Expires today' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`;
