import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherAlertSettings {
  enabled: boolean;
  postalCodes: string[];
  /** Insurance threshold: rain over a rolling 24h window (skybrud coverage typically 30–40 mm). */
  rain24hMm: number;
  /** Insurance threshold: heavy rain within 30 minutes. */
  rain30minMm: number;
  /** Insurance threshold: wind gusts (storm coverage at >= 17.2 m/s). */
  gustMs: number;
}

export const DEFAULT_WEATHER_ALERT_SETTINGS: WeatherAlertSettings = {
  enabled: true,
  postalCodes: [],
  rain24hMm: 30,
  rain30minMm: 15,
  gustMs: 17.2,
};

const SETTING_KEY = 'weather_alert';

const parseSettings = (raw?: string | null): WeatherAlertSettings => {
  if (!raw) return DEFAULT_WEATHER_ALERT_SETTINGS;
  try {
    const p = JSON.parse(raw);
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
      postalCodes: Array.isArray(p.postalCodes)
        ? p.postalCodes.filter((x: unknown) => typeof x === 'string' && /^\d{4}$/.test(x))
        : [],
      // Legacy saves only had rain6hMm — fall back to insurance defaults for the new fields.
      rain24hMm: Number.isFinite(p.rain24hMm) ? Number(p.rain24hMm) : DEFAULT_WEATHER_ALERT_SETTINGS.rain24hMm,
      rain30minMm: Number.isFinite(p.rain30minMm) ? Number(p.rain30minMm) : DEFAULT_WEATHER_ALERT_SETTINGS.rain30minMm,
      gustMs: Number.isFinite(p.gustMs) ? Number(p.gustMs) : DEFAULT_WEATHER_ALERT_SETTINGS.gustMs,
    };
  } catch {
    return DEFAULT_WEATHER_ALERT_SETTINGS;
  }
};

export const useWeatherAlertSettings = (departmentId?: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['weather-alert-settings', departmentId],
    enabled: !!departmentId,
    staleTime: 15 * 60 * 1000,
    queryFn: async (): Promise<WeatherAlertSettings> => {
      const { data, error } = await supabase
        .from('department_settings')
        .select('setting_value')
        .eq('department_id', departmentId!)
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return parseSettings(data?.setting_value);
    },
  });

  const save = useMutation({
    mutationFn: async (settings: WeatherAlertSettings) => {
      if (!departmentId) throw new Error('Ingen afdeling valgt');
      const { error } = await supabase.from('department_settings').upsert(
        {
          department_id: departmentId,
          setting_key: SETTING_KEY,
          setting_value: JSON.stringify(settings),
        },
        { onConflict: 'department_id,setting_key' }
      );
      if (error) throw error;
      return settings;
    },
    onSuccess: settings => {
      queryClient.setQueryData(['weather-alert-settings', departmentId], settings);
    },
  });

  return {
    settings: query.data ?? DEFAULT_WEATHER_ALERT_SETTINGS,
    isLoading: query.isLoading,
    save: save.mutateAsync,
    isSaving: save.isPending,
  };
};

interface PostalPoint { nr: string; navn: string; lat: number; lng: number }

/** Resolve Danish postal codes to coordinates via DAWA. */
export const usePostalCodeCoordinates = (postalCodes: string[]) => {
  const key = [...postalCodes].sort().join(',');
  return useQuery({
    queryKey: ['dawa-postnumre', key],
    enabled: postalCodes.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<PostalPoint[]> => {
      const results = await Promise.all(
        postalCodes.map(async nr => {
          try {
            const res = await fetch(`https://api.dataforsyningen.dk/postnumre/${nr}`);
            if (!res.ok) return null;
            const j = await res.json();
            const c = j?.visueltcenter;
            if (!Array.isArray(c)) return null;
            return { nr, navn: j.navn as string, lng: c[0] as number, lat: c[1] as number };
          } catch {
            return null;
          }
        })
      );
      return results.filter(Boolean) as PostalPoint[];
    },
  });
};
