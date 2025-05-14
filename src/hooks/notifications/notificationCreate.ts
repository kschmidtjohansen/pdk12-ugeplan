
import { useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

export const useNotificationCreate = (
  user: any | null,
  setNotifications: (notifications: NotificationType[] | ((prev: NotificationType[]) => NotificationType[])) => void,
  setUnreadCount: (count: number | ((prev: number) => number)) => void
) => {
  const { toast } = useToast();

  // Add a new notification
  const addNotification = useCallback(async (
    notification: Omit<NotificationType, 'id' | 'read' | 'date'> & { targetUserId?: string }
  ) => {
    if (!user) {
      console.error('Cannot add notification: No authenticated user');
      return null;
    }
    
    try {
      // Use the provided target user ID or the current user's ID
      const userId = notification.targetUserId || user.id;
      
      console.log(`Creating notification for user ${userId}:`, notification);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: false
          }
        ])
        .select();
      
      if (error) {
        // Specific handling for RLS policy violations
        if (error.message?.includes('new row violates row-level security policy')) {
          console.error('Permission denied: You do not have permission to create notifications for this user.');
          toast({
            title: "Permission denied",
            description: "You don't have permission to create notifications for this user.",
            variant: "destructive"
          });
        } else {
          console.error('Error inserting notification:', error);
        }
        throw error;
      }
      
      console.log('Notification created successfully:', data);
      
      // If notification is for the current user, update local state
      if (userId === user.id && data && data[0]) {
        const newNotification: NotificationType = {
          id: data[0].id,
          type: data[0].type,
          title: data[0].title,
          message: data[0].message,
          link: data[0].link || undefined,
          read: false,
          date: new Date(data[0].created_at)
        };
        
        // Add to notifications and resort
        setNotifications((prev: NotificationType[]) => {
          const updated = [...prev, newNotification];
          updated.sort(sortNotifications);
          return updated;
        });
        
        // Increment unread count
        setUnreadCount((prev: number) => prev + 1);
        
        // Show toast for new notification
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
      
      return data?.[0]?.id;
    } catch (err) {
      console.error('Error adding notification:', err);
      return null;
    }
  }, [user, toast, setNotifications, setUnreadCount]);

  return {
    addNotification
  };
};
