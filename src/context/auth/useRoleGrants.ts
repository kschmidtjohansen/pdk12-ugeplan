import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from './types';

/**
 * Loads the union of the extra permissions IT-Support has granted to ANY of
 * the given roles. A user with multiple roles (e.g. Skadeleder + Fugttekniker)
 * gets the combined grants of all their roles. super_admin needs no grants.
 */
export function useRoleGrants(roles: readonly UserRole[] | null | undefined, enabled: boolean): ReadonlySet<string> {
  const [grants, setGrants] = useState<ReadonlySet<string>>(new Set());
  // Stable key so the effect only re-runs when the actual role set changes.
  const key = (roles ?? []).filter((r) => r && r !== 'super_admin').sort().join(',');

  useEffect(() => {
    const list = (key ? key.split(',') : []) as UserRole[];
    if (list.length === 0 || !enabled) {
      setGrants(new Set());
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .in('role', list);
      if (cancelled) return;
      setGrants(error ? new Set() : new Set((data ?? []).map((r) => r.permission)));
    };
    void load();
    const onChange = () => void load();
    window.addEventListener('role-permissions-changed', onChange);
    return () => {
      cancelled = true;
      window.removeEventListener('role-permissions-changed', onChange);
    };
  }, [key, enabled]);

  return grants;
}
