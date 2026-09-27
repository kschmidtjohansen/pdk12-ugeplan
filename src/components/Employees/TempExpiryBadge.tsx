import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { getTempDaysLeft, expiryLabel, TEMP_EXPIRY_WARNING_DAYS } from '@/utils/tempExpiry';
import type { Employee } from '@/types/employee';

const TempExpiryBadge: React.FC<{ employee: Pick<Employee, 'is_temporary' | 'expires_at'>; short?: boolean }> = ({ employee, short }) => {
  const { currentLanguage } = useTranslation();
  const days = getTempDaysLeft(employee);
  if (days === null || days > TEMP_EXPIRY_WARNING_DAYS) return null;
  const isDa = currentLanguage === 'da';
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-soft-foreground">
      <Clock className="h-3 w-3" aria-hidden />
      {short ? (isDa ? 'Udløber snart' : 'Expiring soon') : expiryLabel(days, isDa)}
    </span>
  );
};

export default TempExpiryBadge;
