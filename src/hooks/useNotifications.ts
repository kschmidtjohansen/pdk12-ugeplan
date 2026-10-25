
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationFetching } from './notifications/notificationFetching';
import { useNotificationActions } from './notifications/notificationActions'; 
import { useNotificationCreate } from './notifications/notificationCreate';
import { useNotificationRealtime } from './notifications/notificationRealtime';
import { useVacationNotifications } from './notifications/vacationNotifications';

export const useNotifications = () => {
  const { user } = useAuth();
  const systemReadyRef = useRef<string | null>(null);
  
  const { 
    notifications, 
    setNotifications,
    unreadCount, 
    setUnreadCount,
    loading,
    error,
    fetchNotifications 
  } = useNotificationFetching(user);
  
  const { 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications
  } = useNotificationActions(user, notifications, setNotifications, setUnreadCount);
  
  const { addNotification } = useNotificationCreate(user, setNotifications, setUnreadCount);
  
  useNotificationRealtime(user, setNotifications, setUnreadCount, fetchNotifications);
  
  const { createNotificationsForPendingRequests } = useVacationNotifications(user, addNotification);
  
  useEffect(() => {
    if (user && user.role !== 'administrator' && user.role !== 'super_admin' && notifications.length > 0) {
      const filteredNotifications = notifications.filter(notification => {
        if (notification.targetUserId === user.id) return true;
        if (notification.type === 'sick_day') return false;
        if (notification.type === 'vacation' && /ansøgt|anmod|requested/i.test(notification.message || '')) return false;
        return true;
      });
      
      if (filteredNotifications.length !== notifications.length) {
        if (import.meta.env.DEV) {
          console.log(`Filtered out ${notifications.length - filteredNotifications.length} notifications for non-admin user`);
        }
        setNotifications(filteredNotifications);
        const unreadFiltered = filteredNotifications.filter(n => !n.read).length;
        setUnreadCount(unreadFiltered);
      }
    }
  }, [user, notifications, setNotifications, setUnreadCount]);
  
  useEffect(() => {
    if ((user?.role === 'administrator' || user?.role === 'super_admin') && !loading && notifications.length >= 0 && systemReadyRef.current !== user?.id) {
      if (import.meta.env.DEV) {
        console.log('Checking for any missing admin notifications for pending vacations');
      }
      createNotificationsForPendingRequests();
      systemReadyRef.current = user.id;
    }
  }, [user, loading, notifications.length, createNotificationsForPendingRequests]);
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addNotification
  };
};
