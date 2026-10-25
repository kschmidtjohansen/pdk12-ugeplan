import type { AppUser as User } from '@/context/auth/types';

import { useCallback, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationActions = (
  user: User | null,
  notifications: NotificationType[],
  setNotifications: (notifications: NotificationType[] | ((prev: NotificationType[]) => NotificationType[])) => void,
  setUnreadCount: (count: number | ((prev: number) => number)) => void
) => {
  const client = useQueryClient();
  const activeUser = useRef(user?.id);
  activeUser.current = user?.id;
  const invalidate = useCallback(() => { if (user?.id) void client.invalidateQueries({ queryKey: ['notifications', 'infinite', user.id] }); }, [client, user?.id]);
  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId).eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      if (activeUser.current !== user.id) return;
      invalidate();
      // Update local state
      setNotifications((prev: NotificationType[]) => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Recalculate unread count
      if (notifications.some(n => n.id === notificationId && !n.read)) setUnreadCount((prev: number) => Math.max(0, prev - 1));
      
    } catch { /* Keep local rows unchanged on a failed server mutation. */ }
  }, [user, notifications, setNotifications, setUnreadCount, invalidate]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) {
        throw error;
      }
      
      if (activeUser.current !== user.id) return;
      invalidate();
      // Update local state
      setNotifications((prev: NotificationType[]) => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch { /* Keep local rows unchanged on a failed server mutation. */ }
  }, [user, setNotifications, setUnreadCount, invalidate]);
  
  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId).eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      if (activeUser.current !== user.id) return;
      invalidate();
      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      setNotifications((prev: NotificationType[]) => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Recalculate unread count if needed
      if (wasUnread) {
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
      
    } catch { /* Keep local rows unchanged on a failed server mutation. */ }
  }, [user, notifications, setNotifications, setUnreadCount, invalidate]);

  // Delete all notifications for the current user
  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      if (activeUser.current !== user.id) return;
      invalidate();
      // Update local state - clear all notifications
      setNotifications([]);
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch { /* Keep local rows unchanged on a failed server mutation. */ }
  }, [user, setNotifications, setUnreadCount, invalidate]);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  };
};
