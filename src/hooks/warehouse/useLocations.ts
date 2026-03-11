import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocationItem {
  key: string;
  label: string;
}

/** Normalize parsed JSON into LocationItem[] — handles multiple legacy formats */
const normalizeLocations = (parsed: unknown): LocationItem[] => {
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item: unknown) => {
      if (typeof item === 'string') {
        return { key: item, label: formatHallKey(item) };
      }
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const key = (obj.key ?? obj.id ?? '') as string;
        const label = (obj.label ?? obj.name ?? formatHallKey(key)) as string;
        if (key) return { key, label };
      }
      return null;
    })
    .filter((x): x is LocationItem => x !== null);
};

/** Convert a hall key like 'sort_hal' → 'Sort Hal' */
const formatHallKey = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const useLocations = (departmentId: string | null) => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!departmentId) {
      setLocations([]);
      return;
    }

    const fetchLocations = async () => {
      setLoading(true);
      try {
        // 1. Try department_settings first
        const { data, error } = await supabase
          .from('department_settings')
          .select('setting_value')
          .eq('department_id', departmentId)
          .eq('setting_key', 'locations')
          .maybeSingle();

        if (!error && data?.setting_value) {
          try {
            const parsed = JSON.parse(data.setting_value);
            const normalized = normalizeLocations(parsed);
            if (normalized.length > 0) {
              setLocations(normalized);
              return;
            }
          } catch {
            // Fall through to fallback
          }
        }

        // 2. Fallback: derive locations from existing warehouse_items.hall values
        const { data: hallData, error: hallError } = await supabase
          .from('warehouse_items')
          .select('hall')
          .eq('department_id', departmentId)
          .not('hall', 'is', null);

        if (!hallError && hallData && hallData.length > 0) {
          const uniqueHalls = [...new Set(hallData.map(h => h.hall).filter(Boolean))] as string[];
          const fallbackLocations = uniqueHalls.map(h => ({
            key: h,
            label: formatHallKey(h),
          }));
          setLocations(fallbackLocations);
        } else {
          setLocations([]);
        }
      } catch {
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [departmentId]);

  const getLocationLabel = (hallId: string | null): string | null => {
    if (!hallId) return null;
    const found = locations.find(l => l.key === hallId);
    if (found) return found.label;
    return formatHallKey(hallId);
  };

  return { locations, loading, setLocations, getLocationLabel };
};
