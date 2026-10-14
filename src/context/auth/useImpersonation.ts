import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { unifiedDataService } from '@/services/data/unifiedDataService';
import { OptimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import type { AppUser, ImpersonationTarget } from './types';

const IMPERSONATION_KEY = 'impersonated_user';

/**
 * IT-Support impersonation ("ager som medarbejder"). The Supabase session is
 * untouched — only the identity the UI renders changes. Stored in
 * sessionStorage so it survives navigation but never outlives the tab.
 */
export function useImpersonation(user: AppUser | null) {
  const queryClient = useQueryClient();
  const [impersonatedUser, setImpersonatedUser] = useState<AppUser | null>(() => {
    try {
      const raw = sessionStorage.getItem(IMPERSONATION_KEY);
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
      return null;
    }
  });

  const clearCaches = useCallback(() => {
    queryClient.clear();
    unifiedDataService.clearCache();
    OptimizedAssignmentService.clearCache();
    enhancedDataFetching.clearCache();
  }, [queryClient]);

  const canImpersonate = user?.role === 'super_admin';
  const isImpersonating = !!impersonatedUser && canImpersonate;
  const effectiveUser: AppUser | null = isImpersonating ? impersonatedUser : user;

  const startImpersonation = useCallback((target: ImpersonationTarget) => {
    if (user?.role !== 'super_admin' || target.id === user.id) return;
    const next: AppUser = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      roles: target.roles && target.roles.length > 0 ? target.roles : [target.role],
    };
    try {
      sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setImpersonatedUser(next);
    clearCaches();
  }, [user, clearCaches]);

  const stopImpersonation = useCallback(() => {
    try {
      sessionStorage.removeItem(IMPERSONATION_KEY);
    } catch {
      // ignore storage errors
    }
    setImpersonatedUser(null);
    clearCaches();
  }, [clearCaches]);

  /** Drop impersonation state without cache work (used during logout). */
  const resetImpersonation = useCallback(() => setImpersonatedUser(null), []);

  return { canImpersonate, isImpersonating, effectiveUser, startImpersonation, stopImpersonation, resetImpersonation };
}
