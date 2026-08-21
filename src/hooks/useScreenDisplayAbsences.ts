import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AbsentEmployee {
  id: string;
  name: string;
}

interface Result {
  absences: AbsentEmployee[];
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Public RPC used by the kiosk /screen-display page. Works without a logged-in
 * user; SECURITY DEFINER on the DB side scopes the result to the given
 * department only.
 */
export const useScreenDisplayAbsences = (
  date: string,
  departmentId: string | null
): Result => {
  const [absences, setAbsences] = useState<AbsentEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAbsences = useCallback(async () => {
    if (!date || !departmentId) {
      setAbsences([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('list_screen_display_absences', {
        p_department_id: departmentId,
        p_date: date,
      });
      if (error) {
        if (import.meta.env.DEV) console.error('[useScreenDisplayAbsences] rpc error:', error.message);
        setAbsences([]);
        return;
      }
      setAbsences(((data as any[]) || []).map((r) => ({ id: r.id, name: r.name })));
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useScreenDisplayAbsences] error:', err);
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  }, [date, departmentId]);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  return { absences, loading, refetch: fetchAbsences };
};
