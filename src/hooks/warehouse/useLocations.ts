import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocationItem {
  key: string;
  label: string;
}

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
        const { data, error } = await supabase
          .from('department_settings')
          .select('setting_value')
          .eq('department_id', departmentId)
          .eq('setting_key', 'locations')
          .maybeSingle();

        if (error) {
          if (import.meta.env.DEV) console.error('Error fetching locations:', error);
          setLocations([]);
          return;
        }

        if (data?.setting_value) {
          try {
            const parsed = JSON.parse(data.setting_value);
            setLocations(Array.isArray(parsed) ? parsed : []);
          } catch {
            setLocations([]);
          }
        } else {
          setLocations([]);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error fetching locations:', err);
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
    // Fallback formatting
    return hallId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return { locations, loading, setLocations, getLocationLabel };
};
