import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/context/TranslationContext';
import type { Employee } from '@/types/employee';

type EmailStatus = 'available' | 'active' | 'inactive' | 'auth_only';
export interface EmailCheckState {
  state: 'idle' | 'checking' | 'done' | 'error';
  status?: EmailStatus;
  name?: string;
  profileStatus?: string;
}
type CachedResult = Omit<EmailCheckState, 'state'>;

/** Checks whether an email is already in use (new employees only), with a per-dialog cache. */
export function useEmailCheck(currentEmployee: Employee | null, rawEmail: string | undefined) {
  const { t } = useTranslation();
  const [emailCheck, setEmailCheck] = useState<EmailCheckState>({ state: 'idle' });
  const cacheRef = useRef<Map<string, CachedResult>>(new Map());

  const emailStatusLabel = useCallback((profileStatus?: string) => {
    switch (profileStatus) {
      case 'on_leave': return t('employees.emailStatusOnLeave');
      case 'terminated': return t('employees.emailStatusTerminated');
      case 'inactive': return t('employees.emailStatusInactive');
      default: return t('employees.emailStatusActive');
    }
  }, [t]);

  const runEmailCheck = async () => {
    if (currentEmployee) return;
    const email = (rawEmail || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailCheck({ state: 'idle' });
      return;
    }
    const cached = cacheRef.current.get(email);
    if (cached) {
      setEmailCheck({ state: 'done', ...cached });
      return;
    }
    setEmailCheck({ state: 'checking' });
    try {
      const { data, error } = await supabase.functions.invoke('check-user-email', { body: { email } });
      if (error || !data?.status) {
        setEmailCheck({ state: 'error' });
        return;
      }
      const result: CachedResult = { status: data.status, name: data.name, profileStatus: data.profileStatus };
      cacheRef.current.set(email, result);
      setEmailCheck({ state: 'done', ...result });
    } catch {
      setEmailCheck({ state: 'error' });
    }
  };

  return { emailCheck, setEmailCheck, runEmailCheck, emailStatusLabel };
}
