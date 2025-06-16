
import { useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNotificationCreate = (
  user: any | null,
  addNotificationToState: (notification: NotificationType) => void,
  onRefresh?: () => void
) => {
  const { toast } = useToast();

  const addNotification = useCallback(async (
    notification: Omit<NotificationType, 'id' | 'read' | 'date'> & { targetUserId?: string }
  ): Promise<string | null> => {
    if (!user) {
      console.warn('[NotificationCreate] No user available');
      return null;
    }

    try {
      const targetUserId = notification.targetUserId || user.id;
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          read: false
        })
        .select('*')
        .single();

      if (error) {
        console.error('[NotificationCreate] Error creating notification:', error);
        throw error;
      }

      if (data) {
        console.log('[NotificationCreate] Notification created successfully:', data.id);
        
        const formattedNotification: NotificationType = {
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || undefined,
          read: data.read,
          date: new Date(data.created_at),
          targetUserId: data.user_id
        };

        // Only add to state if it's for the current user
        if (data.user_id === user.id) {
          addNotificationToState(formattedNotification);
        }

        if (onRefresh) {
          onRefresh();
        }

        return data.id;
      }

      return null;
    } catch (error) {
      console.error('[NotificationCreate] Error creating notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create notification',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, addNotificationToState, onRefresh, toast]);

  return { addNotification };
};
