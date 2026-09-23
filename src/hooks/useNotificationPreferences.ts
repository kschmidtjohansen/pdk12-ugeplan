import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type NotificationPreferenceKey =
  | 'broadcast'
  | 'assignment'
  | 'duty'
  | 'vacation'
  | 'sick_day';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

const DEFAULTS: NotificationPreferences = {
  broadcast: true,
  assignment: true,
  duty: true,
  vacation: true,
  sick_day: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('notification_preferences')
        .select('broadcast, assignment, duty, vacation, sick_day')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (loadError) {
        setError(loadError.message);
      } else if (data) {
        setPreferences({ ...DEFAULTS, ...data });
      } else {
        setPreferences(DEFAULTS);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const updatePreference = useCallback(
    async (key: NotificationPreferenceKey, value: boolean) => {
      if (!user?.id) return;
      const previous = preferences;
      const next = { ...preferences, [key]: value };
      setPreferences(next);
      setSaving(true);
      setError(null);

      const { error: saveError } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });

      if (saveError) {
        setPreferences(previous);
        setError(saveError.message);
      }
      setSaving(false);
    },
    [preferences, user?.id],
  );

  return { preferences, loading, saving, error, updatePreference };
};

export default useNotificationPreferences;
