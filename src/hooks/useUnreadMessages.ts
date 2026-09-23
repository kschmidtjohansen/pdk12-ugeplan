import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToTable } from '@/lib/realtimeChannels';
import { useAuth } from '@/context/AuthContext';

const STORAGE_KEY = 'pdk12:messages:lastRead';
const LOOKBACK_DAYS = 45;

type ReadMap = Record<string, string>;

const loadReadMap = (): ReadMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadMap) : {};
  } catch {
    return {};
  }
};

const saveReadMap = (map: ReadMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
};

export interface UnreadMessagesState {
  /** Unread message count per assignment id */
  unreadByAssignment: Record<string, number>;
  /** Total unread messages across the user's assignments */
  totalUnread: number;
  /** True if the given assignment (or any of its sibling days) has unread messages */
  hasUnread: (assignmentIds: string | string[]) => boolean;
  /** Count for the given assignment (or sibling series) */
  unreadFor: (assignmentIds: string | string[]) => number;
  /** Mark an assignment (or sibling series) as read */
  markRead: (assignmentIds: string | string[]) => void;
  refresh: () => Promise<void>;
}

export const useUnreadMessages = (): UnreadMessagesState => {
  const { user } = useAuth();
  const [readMap, setReadMap] = useState<ReadMap>(() => loadReadMap());
  const [rows, setRows] = useState<{ assignment_id: string; created_at: string }[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      return;
    }

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [assignedRes, responsibleRes] = await Promise.all([
        supabase.from('assignments_employees').select('assignment_id').eq('user_id', user.id),
        supabase.from('assignments').select('id').eq('responsible_user_id', user.id).gte('assignment_date', since.slice(0, 10)),
      ]);

      const ids = new Set<string>();
      (assignedRes.data || []).forEach((r) => r.assignment_id && ids.add(r.assignment_id));
      (responsibleRes.data || []).forEach((r) => r.id && ids.add(r.id));

      if (ids.size === 0) {
        setRows([]);
        return;
      }

      const { data } = await supabase
        .from('assignment_messages')
        .select('assignment_id, created_at, user_id')
        .in('assignment_id', Array.from(ids))
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);

      setRows(
        (data || [])
          .filter((m) => m.user_id !== user.id)
          .map((m) => ({ assignment_id: m.assignment_id, created_at: m.created_at }))
      );
    } catch {
      setRows([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchMessages();
    if (!user?.id) return;

    const unsubscribe = subscribeToTable({
      key: `useUnreadMessages:${user.id}`,
      table: 'assignment_messages',
      callback: () => {
        void fetchMessages();
      },
    });
    return () => unsubscribe();
  }, [fetchMessages, user?.id]);

  const unreadByAssignment = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      const lastRead = readMap[row.assignment_id];
      if (lastRead && new Date(row.created_at) <= new Date(lastRead)) return;
      counts[row.assignment_id] = (counts[row.assignment_id] || 0) + 1;
    });
    return counts;
  }, [rows, readMap]);

  const totalUnread = useMemo(
    () => Object.values(unreadByAssignment).reduce((sum, n) => sum + n, 0),
    [unreadByAssignment]
  );

  const unreadFor = useCallback(
    (assignmentIds: string | string[]) => {
      const list = Array.isArray(assignmentIds) ? assignmentIds : [assignmentIds];
      return list.reduce((sum, id) => sum + (unreadByAssignment[id] || 0), 0);
    },
    [unreadByAssignment]
  );

  const hasUnread = useCallback(
    (assignmentIds: string | string[]) => unreadFor(assignmentIds) > 0,
    [unreadFor]
  );

  const markRead = useCallback((assignmentIds: string | string[]) => {
    const list = (Array.isArray(assignmentIds) ? assignmentIds : [assignmentIds]).filter(Boolean);
    if (list.length === 0) return;
    setReadMap((prev) => {
      const next = { ...prev };
      const now = new Date().toISOString();
      list.forEach((id) => {
        next[id] = now;
      });
      saveReadMap(next);
      return next;
    });
  }, []);

  return { unreadByAssignment, totalUnread, hasUnread, unreadFor, markRead, refresh: fetchMessages };
};
