import type { AppUser as User } from '@/context/auth/types';
import { useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationRealtime = (
  user: User | null,
  _setNotifications: (updater: (prev: NotificationType[]) => NotificationType[]) => void,
  _setUnreadCount: (updater: (prev: number) => number) => void,
  catchUp: () => Promise<void>,
) => {
  const { toast } = useToast();
  const callback = useRef(catchUp);
  callback.current = catchUp;
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const seen = new Set<string>(); // current account/subscription only, no global history
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (active) void callback.current(); }, 100);
    };
    const channel = supabase.channel(`inbox:${userId}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        if (!active) return;
        refresh(); // refetch is authoritative for INSERT/UPDATE/DELETE and both caches
        const row = payload.new as { id?: string; user_id?: string; read?: boolean; title?: string; message?: string };
        if (payload.eventType !== 'INSERT' || row.user_id !== userId || !row.id || row.read || seen.has(row.id)) return;
        seen.add(row.id);
        if (seen.size > 500) seen.delete(seen.values().next().value ?? '');
        toast({ title: row.title ?? '', description: row.message ?? '' });
      }).subscribe(status => { if (active && status === 'SUBSCRIBED') refresh(); });
    return () => { active = false; clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [userId, toast]);
};
