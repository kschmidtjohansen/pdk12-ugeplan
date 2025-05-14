
import { useEffect } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

export const useNotificationRealtime = (
  user: any | null,
  setNotifications: (updater: (prev: NotificationType[]) => NotificationType[]) => void,
  setUnreadCount: (updater: (prev: number) => number) => void
) => {
  const { toast } = useToast();

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) {
      console.log('No user, skipping real-time subscription');
      return;
    }
    
    // Create a unique channel name for this user and instance to prevent duplicate subscriptions
    const channelName = `notification_changes_${user.id}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Setting up realtime subscription for notifications using channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log(`Received new notification via realtime for user ${user.id}:`, payload);
          
          // A new notification has been inserted
          if (payload.new) {
            const newNotification: NotificationType = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link || undefined,
              read: payload.new.read,
              date: new Date(payload.new.created_at)
            };
            
            console.log('Processing new notification:', newNotification);
            
            // Add to notifications and resort
            setNotifications((prev: NotificationType[]) => {
              // Check if notification already exists to prevent duplicates
              if (prev.some(n => n.id === newNotification.id)) {
                console.log('Notification already exists in state, skipping');
                return prev;
              }
              
              const updated = [...prev, newNotification];
              updated.sort(sortNotifications);
              return updated;
            });
            
            // Increment unread count if unread
            if (!payload.new.read) {
              setUnreadCount((prev: number) => prev + 1);
              
              // Show toast for new notification
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Notification subscription status for user ${user.id}:`, status);
      });
      
    return () => {
      console.log(`Cleaning up notification subscription for user ${user.id}`);
      supabase.removeChannel(channel);
    };
  }, [user, toast, setNotifications, setUnreadCount]);
};
