
import { useState, useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { sortNotifications } from '@/utils/notifications';

export const useNotificationState = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const updateNotifications = useCallback((newNotifications: NotificationType[]) => {
    const sortedNotifications = [...newNotifications].sort(sortNotifications);
    setNotifications(sortedNotifications);
    setUnreadCount(sortedNotifications.filter(n => !n.read).length);
  }, []);

  const addNotificationToState = useCallback((notification: NotificationType) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      const sorted = updated.sort(sortNotifications);
      setUnreadCount(sorted.filter(n => !n.read).length);
      return sorted;
    });
  }, []);

  const removeNotificationFromState = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notificationId);
      setUnreadCount(filtered.filter(n => !n.read).length);
      return filtered;
    });
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      setUnreadCount(0);
      return updated;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    setLoading,
    updateNotifications,
    addNotificationToState,
    removeNotificationFromState,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };
};
