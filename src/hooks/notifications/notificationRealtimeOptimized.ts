
import { useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationRealtimeOptimized = (
  user: any | null,
  addNotificationToState: (notification: NotificationType) => void,
  fetchNotifications: () => void
) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    console.log('[NotificationRealtime] Setting up realtime subscription for user:', user.id);
    
    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[NotificationRealtime] Debounced refresh triggered');
        fetchNotifications();
      }, 1000);
    };

    channelRef.current = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[NotificationRealtime] Received change:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newNotification: NotificationType = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link || undefined,
              read: payload.new.read,
              date: new Date(payload.new.created_at),
              targetUserId: payload.new.user_id
            };
            addNotificationToState(newNotification);
          } else {
            debouncedRefresh();
          }
        }
      )
      .subscribe((status) => {
        console.log('[NotificationRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[NotificationRealtime] Cleaning up subscription');
      clearTimeout(timeoutId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, addNotificationToState, fetchNotifications]);
};
