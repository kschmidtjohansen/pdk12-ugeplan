import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from './types';

/** Loads the extra permissions IT-Support has granted to the given role. */
export function useRoleGrants(role: UserRole | null | undefined, enabled: boolean): ReadonlySet<string> {
  const [grants, setGrants] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!role || !enabled || role === 'super_admin') {
      setGrants(new Set());
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', role);
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
  }, [role, enabled]);

  return grants;
}
