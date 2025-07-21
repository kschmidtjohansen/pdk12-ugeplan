
import { useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/context/AuthContext';

export const useNotificationActions = (
  user: AppUser | null,
  notifications: NotificationType[],
  setNotifications: (notifications: NotificationType[] | ((prev: NotificationType[]) => NotificationType[])) => void,
  setUnreadCount: (count: number | ((prev: number) => number)) => void
) => {
  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
      
      // Update local state
      setNotifications((prev: NotificationType[]) => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Recalculate unread count
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user, setNotifications, setUnreadCount]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Marking all notifications as read');
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
      
      // Update local state
      setNotifications((prev: NotificationType[]) => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user, setNotifications, setUnreadCount]);
  
  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      console.log('Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
      
      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      setNotifications((prev: NotificationType[]) => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Recalculate unread count if needed
      if (wasUnread) {
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [user, notifications, setNotifications, setUnreadCount]);

  // Delete all notifications for the current user
  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Deleting all notifications for user:', user.id);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting all notifications:', error);
        throw error;
      }
      
      // Update local state - clear all notifications
      setNotifications([]);
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  }, [user, setNotifications, setUnreadCount]);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  };
};
