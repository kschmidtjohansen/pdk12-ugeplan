import type { AppUser as User } from '@/context/auth/types';

import { useState, useCallback, useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

export const useNotificationFetching = (user: User | null) => {
  const userId = user?.id;
  const client = useQueryClient();
  const [accountRows, setAccountRows] = useState<{ userId?: string; rows: NotificationType[] }>({ rows: [] });
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const generation = useRef(0);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState(false);
  const notifications = accountRows.userId === userId ? accountRows.rows : [];
  const setNotifications = useCallback((value: NotificationType[] | ((prev: NotificationType[]) => NotificationType[])) => {
    if (currentUser.current !== userId) return;
    setAccountRows(prev => ({ userId, rows: typeof value === 'function' ? value(prev.userId === userId ? prev.rows : []) : value }));
  }, [userId]);
  // Count is derived from the same rows, never incremented separately by duplicate events.
  const unreadCount = notifications.filter(n => !n.read).length;
  const setUnreadCount = useCallback((_value: number | ((prev: number) => number)) => {}, []);
  const fetchNotifications = useCallback(async () => {
    const version = ++generation.current;
    if (!userId) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    try {
      const rows: NotificationType[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('notifications').select('*')
          .eq('user_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 499);
        if (error) throw error;
        rows.push(...(data ?? []).map(item => ({ id: item.id, type: item.type, title: item.title,
          message: item.message, link: item.link || undefined, read: item.read, date: new Date(item.created_at), targetUserId: userId })));
        if ((data?.length ?? 0) < 500) break;
        if (currentUser.current !== userId || version !== generation.current) return;
      }
      if (currentUser.current !== userId || version !== generation.current) return;
      setNotifications(rows.sort(sortNotifications));
      setError(false);
      void client.invalidateQueries({ queryKey: ['notifications', 'infinite', userId] });
    } catch {
      if (currentUser.current === userId && version === generation.current) setError(true);
    } finally {
      if (currentUser.current === userId && version === generation.current) setLoading(false);
    }
  }, [userId, setNotifications, client]);
  useEffect(() => {
    setNotifications([]);
    void fetchNotifications();
    const wake = () => { if (document.visibilityState === 'visible') void fetchNotifications(); };
    window.addEventListener('focus', wake);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    // Bounded visible-tab catch-up covers missed reconnect DELETE/UPDATE events too.
    const timer = window.setInterval(wake, 300_000);
    return () => { ++generation.current; clearInterval(timer); window.removeEventListener('focus', wake);
      window.removeEventListener('online', wake); document.removeEventListener('visibilitychange', wake); };
  }, [fetchNotifications, setNotifications]);
  return { notifications, setNotifications, unreadCount, setUnreadCount, loading, error, fetchNotifications };
};
