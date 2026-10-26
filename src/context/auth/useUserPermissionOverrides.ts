import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Loads the personal on/off permission choices IT-Support set for one user. */
export function useUserPermissionOverrides(userId: string | null | undefined, enabled: boolean): ReadonlyMap<string, boolean> {
  const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());

  useEffect(() => {
    if (!userId || !enabled) {
      setOverrides(new Map());
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission, granted')
        .eq('user_id', userId);
      if (cancelled) return;
      setOverrides(error ? new Map() : new Map((data ?? []).map((r) => [r.permission, r.granted])));
    };
    void load();
    const onChange = () => void load();
    window.addEventListener('role-permissions-changed', onChange);
    return () => {
      cancelled = true;
      window.removeEventListener('role-permissions-changed', onChange);
    };
  }, [userId, enabled]);

  return overrides;
}
