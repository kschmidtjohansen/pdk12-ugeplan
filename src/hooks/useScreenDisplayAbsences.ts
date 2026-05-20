import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AbsentEmployee {
  id: string;
  name: string;
}

interface Result {
  absences: AbsentEmployee[];
  loading: boolean;
}

/**
 * Fetches employees absent on the given date for the whole department,
 * via a SECURITY DEFINER RPC so RLS on vacations/profiles does not block
 * kiosk/screen-display users.
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
      const { data, error } = await supabase.rpc('get_department_absences', {
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

  return { absences, loading };
};
