
import { useCallback, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationFetchingOptimized = (
  user: any | null,
  updateNotifications: (notifications: NotificationType[]) => void,
  setLoading: (loading: boolean) => void
) => {
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user || isFetchingRef.current) {
      setLoading(false);
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      console.log(`[NotificationFetch] Fetching notifications for user ${user.id}`);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[NotificationFetch] Error:', error);
        throw error;
      }
      
      if (data) {
        console.log(`[NotificationFetch] Fetched ${data.length} notifications`);
        
        const formattedNotifications: NotificationType[] = data.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          link: item.link || undefined,
          read: item.read,
          date: new Date(item.created_at),
          targetUserId: user.id
        }));
        
        updateNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('[NotificationFetch] Error fetching notifications:', err);
      updateNotifications([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, updateNotifications, setLoading]);

  return { fetchNotifications };
};
