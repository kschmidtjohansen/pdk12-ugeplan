import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriveEstimate {
  fromAssignmentId: string;
  distanceKm: number;
  durationMin: number;
}

interface Row {
  assignment_id: string;
  from_assignment_id: string;
  distance_km: number | string;
  duration_min: number;
}

/**
 * Estimated drive from the previous to each of the user's tasks on a day (staged SQL 006,
 * get_my_day_drive_estimates). Until that function exists the map stays empty and nothing is shown.
 * `key` should change when the day's tasks change so the estimates are reloaded.
 */
export const useDriveEstimates = (date: string, key: string, enabled = true) => {
  const [estimates, setEstimates] = useState<Map<string, DriveEstimate>>(() => new Map());

  useEffect(() => {
    if (!enabled || !key) { setEstimates(new Map()); return; }
    let cancelled = false;
    // not in the generated types until the staged function is applied
    const rpc = supabase.rpc as unknown as (f: string, p: Record<string, unknown>) => Promise<{ data: Row[] | null; error: { message: string } | null }>;
    rpc.call(supabase, 'get_my_day_drive_estimates', { p_date: date })
      .then(({ data, error }) => {
        if (cancelled || error || !Array.isArray(data)) return;
        setEstimates(new Map(data.map(r => [r.assignment_id, {
          fromAssignmentId: r.from_assignment_id,
          distanceKm: Number(r.distance_km),
          durationMin: r.duration_min,
        }])));
      })
      .catch(() => { /* estimates are optional */ });
    return () => { cancelled = true; };
  }, [date, key, enabled]);

  return estimates;
};

/** "ca. 14 min i bil · 12 km" / "approx. 14 min drive · 12 km" */
export const formatDrive = (e: DriveEstimate, isDa: boolean) => {
  if (e.durationMin === 0) return isDa ? 'Samme sted som forrige' : 'Same place as before';
  const km = e.distanceKm.toLocaleString(isDa ? 'da-DK' : 'en-GB', { maximumFractionDigits: e.distanceKm < 10 ? 1 : 0 });
  return isDa ? `ca. ${e.durationMin} min i bil · ${km} km` : `approx. ${e.durationMin} min drive · ${km} km`;
};
