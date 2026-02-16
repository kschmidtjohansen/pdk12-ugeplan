import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch GPS coordinates for a Danish postcode via DAWA API (through dawa-proxy edge function).
 * DAWA returns `visueltcenter` as [lng, lat] — we swap to { lat, lng }.
 */
export const fetchPostnrCoords = async (
  postnr: string
): Promise<{ lat: number; lng: number } | null> => {
  if (!postnr || !/^\d{4}$/.test(postnr.trim())) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(
      `${supabaseUrl}/functions/v1/dawa-proxy?postnr=${postnr.trim()}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
          'apikey': anonKey,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    // DAWA visueltcenter is [longitude, latitude]
    if (data?.visueltcenter && Array.isArray(data.visueltcenter) && data.visueltcenter.length === 2) {
      const [lng, lat] = data.visueltcenter;
      return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
};
