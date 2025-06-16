
import { useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const useNotificationActionsOptimized = (
  user: any | null,
  notifications: NotificationType[],
  markNotificationAsRead: (id: string) => void,
  markAllNotificationsAsRead: () => void,
  removeNotificationFromState: (id: string) => void,
  updateNotifications: (notifications: NotificationType[]) => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user, markNotificationAsRead]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      markAllNotificationsAsRead();
      
      toast({
        title: t('notifications.markAllAsRead'),
        description: `${unreadNotifications.length} notifications marked as read`,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  }, [user, notifications, markAllNotificationsAsRead, toast, t]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      removeNotificationFromState(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  }, [user, removeNotificationFromState, toast, t]);

  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      updateNotifications([]);
      
      toast({
        title: 'All notifications deleted',
        description: 'All notifications have been removed',
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to delete notifications',
        variant: 'destructive',
      });
    }
  }, [user, updateNotifications, toast, t]);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  };
};
