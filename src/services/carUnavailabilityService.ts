import { supabase } from '@/integrations/supabase/client';

export interface CarUnavailability {
  id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string | null;
  department_id: string | null;
  released_at: string | null;
  released_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const CarUnavailabilityService = {
  async listActive(departmentId?: string | null): Promise<CarUnavailability[]> {
    let q = (supabase as any)
      .from('car_unavailability')
      .select('*')
      .is('released_at', null)
      .gte('end_date', todayStr())
      .order('start_date', { ascending: true });
    if (departmentId) q = q.eq('department_id', departmentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as CarUnavailability[];
  },

  async listForCar(carId: string): Promise<CarUnavailability[]> {
    const { data, error } = await (supabase as any)
      .from('car_unavailability')
      .select('*')
      .eq('car_id', carId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []) as CarUnavailability[];
  },

  async create(row: {
    car_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
    notes?: string | null;
    department_id?: string | null;
  }): Promise<CarUnavailability> {
    const { data: userRes } = await supabase.auth.getUser();
    const insert = {
      car_id: row.car_id,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || 'Værkstedsbesøg',
      notes: row.notes ?? null,
      department_id: row.department_id ?? null,
      created_by: userRes?.user?.id ?? null,
    };
    const { data, error } = await (supabase as any)
      .from('car_unavailability')
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    return data as CarUnavailability;
  },

  async release(id: string): Promise<void> {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from('car_unavailability')
      .update({
        released_at: new Date().toISOString(),
        released_by: userRes?.user?.id ?? null,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async releaseActiveForCar(carId: string): Promise<void> {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from('car_unavailability')
      .update({
        released_at: new Date().toISOString(),
        released_by: userRes?.user?.id ?? null,
      })
      .eq('car_id', carId)
      .is('released_at', null);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('car_unavailability')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Remove the car from any assignments that fall inside [start,end].
   * Returns the number of affected assignments.
   */
  async cleanupAssignments(carId: string, start: string, end: string): Promise<number> {
    let affected = 0;

    // Assignments with this car as primary
    const { data: primary, error: e1 } = await supabase
      .from('assignments')
      .select('id')
      .eq('car_id', carId)
      .gte('assignment_date', start)
      .lte('assignment_date', end);
    if (e1) throw e1;
    if (primary && primary.length > 0) {
      const ids = primary.map((r: any) => r.id);
      const { error: uErr } = await supabase
        .from('assignments')
        .update({ car_id: null })
        .in('id', ids);
      if (uErr) throw uErr;
      affected += ids.length;
    }

    // Assignments with this car in car_ids array
    const { data: multi, error: e2 } = await supabase
      .from('assignments')
      .select('id, car_ids')
      .contains('car_ids', [carId])
      .gte('assignment_date', start)
      .lte('assignment_date', end);
    if (e2) throw e2;
    if (multi && multi.length > 0) {
      for (const a of multi as any[]) {
        const remaining = (a.car_ids || []).filter((id: string) => id !== carId);
        const { error: uErr } = await supabase
          .from('assignments')
          .update({ car_ids: remaining.length > 0 ? remaining : null })
          .eq('id', a.id);
        if (uErr) throw uErr;
        affected += 1;
      }
    }

    return affected;
  },
};

export const isCarScheduledUnavailableToday = (
  periods: CarUnavailability[],
  carId: string
): CarUnavailability | undefined => {
  const today = todayStr();
  return periods.find(
    (p) =>
      p.car_id === carId &&
      p.released_at === null &&
      p.start_date <= today &&
      p.end_date >= today
  );
};

export const nextScheduledUnavailability = (
  periods: CarUnavailability[],
  carId: string
): CarUnavailability | undefined => {
  const today = todayStr();
  return periods
    .filter((p) => p.car_id === carId && p.released_at === null && p.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
};
