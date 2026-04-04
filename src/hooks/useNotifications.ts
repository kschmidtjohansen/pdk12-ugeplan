
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationFetching } from './notifications/notificationFetching';
import { useNotificationActions } from './notifications/notificationActions'; 
import { useNotificationCreate } from './notifications/notificationCreate';
import { useNotificationRealtime } from './notifications/notificationRealtime';
import { useVacationNotifications } from './notifications/vacationNotifications';

const NOTIFICATION_SYSTEM_READY_KEY = "polygon-notification-system-ready";

const isNotificationSystemReady = (): boolean => {
  try {
    return localStorage.getItem(NOTIFICATION_SYSTEM_READY_KEY) === 'true';
  } catch (err) {
    return false;
  }
};

const markNotificationSystemReady = (): void => {
  try {
    localStorage.setItem(NOTIFICATION_SYSTEM_READY_KEY, 'true');
  } catch (err) {
    if (import.meta.env.DEV) console.error("Error saving notification system status:", err);
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const systemReadyRef = useRef<boolean>(isNotificationSystemReady());
  
  const { 
    notifications, 
    setNotifications,
    unreadCount, 
    setUnreadCount,
    loading, 
    fetchNotifications 
  } = useNotificationFetching(user);
  
  const { 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications
  } = useNotificationActions(user, notifications, setNotifications, setUnreadCount);
  
  const { addNotification } = useNotificationCreate(user, setNotifications, setUnreadCount);
  
  useNotificationRealtime(user, setNotifications, setUnreadCount);
  
  const { createNotificationsForPendingRequests } = useVacationNotifications(user, addNotification);
  
  useEffect(() => {
    if (user && user.role !== 'administrator' && notifications.length > 0) {
      const filteredNotifications = notifications.filter(notification => {
        if (notification.targetUserId === user.id) return true;
        if (notification.type === 'vacation' && !notification.message?.includes(user.name)) return false;
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
    if (user?.role === 'administrator' && !loading && notifications.length >= 0 && !systemReadyRef.current) {
      if (import.meta.env.DEV) {
        console.log('Checking for any missing admin notifications for pending vacations');
      }
      createNotificationsForPendingRequests();
      systemReadyRef.current = true;
      markNotificationSystemReady();
    }
  }, [user, loading, notifications.length, createNotificationsForPendingRequests]);
  
  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addNotification
  };
};
