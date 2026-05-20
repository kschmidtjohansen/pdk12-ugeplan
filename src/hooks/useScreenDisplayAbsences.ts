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
 * Fetches employees absent on the given date for the whole department.
 * Sources:
 *  - vacations with status='approved' covering the date
 *  - profiles with status='on_leave' OR on_leave=true
 * Deduplicates by user id; excludes terminated/hidden-in-planning profiles.
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
      // 1) Department user ids via user_access + super_admin via home_department_id
      const [{ data: accessRows }, { data: homeRows }] = await Promise.all([
        supabase.from('user_access').select('user_id').eq('department_id', departmentId),
        supabase.from('profiles').select('id').eq('home_department_id', departmentId),
      ]);
      const deptUserIds = new Set<string>([
        ...((accessRows || []).map((r: any) => r.user_id)),
        ...((homeRows || []).map((r: any) => r.id)),
      ]);
      if (deptUserIds.size === 0) {
        setAbsences([]);
        return;
      }
      const ids = Array.from(deptUserIds);

      // 2) Run vacation + profile queries in parallel
      const [vacRes, profRes] = await Promise.all([
        supabase
          .from('vacations')
          .select('user_id, profiles:profiles!vacations_user_id_fkey(id, name, status, is_visible_in_planning)')
          .eq('status', 'approved')
          .lte('start_date', date)
          .gte('end_date', date)
          .in('user_id', ids),
        supabase
          .from('profiles')
          .select('id, name, status, on_leave, is_visible_in_planning')
          .in('id', ids)
          .or('status.eq.on_leave,on_leave.eq.true'),
      ]);

      const map = new Map<string, AbsentEmployee>();

      const considerProfile = (p: any) => {
        if (!p?.id || !p?.name) return;
        if (p.status === 'terminated') return;
        if (p.is_visible_in_planning === false) return;
        if (!map.has(p.id)) map.set(p.id, { id: p.id, name: p.name });
      };

      // Vacations: need profile data; fall back to a follow-up fetch if join missing
      const vacRows = (vacRes.data as any[]) || [];
      const missingProfileIds: string[] = [];
      vacRows.forEach((row: any) => {
        if (row.profiles) considerProfile(row.profiles);
        else if (row.user_id) missingProfileIds.push(row.user_id);
      });
      if (missingProfileIds.length > 0) {
        const { data: extra } = await supabase
          .from('profiles')
          .select('id, name, status, is_visible_in_planning')
          .in('id', missingProfileIds);
        (extra || []).forEach(considerProfile);
      }

      ((profRes.data as any[]) || []).forEach(considerProfile);

      const sorted = Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'da')
      );
      setAbsences(sorted);
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
