import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationFetching } from './notifications/notificationFetching';
import { useNotificationActions } from './notifications/notificationActions'; 
import { useNotificationCreate } from './notifications/notificationCreate';
import { useNotificationRealtime } from './notifications/notificationRealtime';
import { useVacationNotifications } from './notifications/vacationNotifications';

// Key for tracking fetch status in localStorage
const NOTIFICATION_SYSTEM_READY_KEY = "polygon-notification-system-ready";

// Track if the notification system initialization has happened in this browser
const isNotificationSystemReady = (): boolean => {
  try {
    return localStorage.getItem(NOTIFICATION_SYSTEM_READY_KEY) === 'true';
  } catch (err) {
    return false;
  }
};

// Mark notification system as ready
const markNotificationSystemReady = (): void => {
  try {
    localStorage.setItem(NOTIFICATION_SYSTEM_READY_KEY, 'true');
  } catch (err) {
    console.error("Error saving notification system status:", err);
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const systemReadyRef = useRef<boolean>(isNotificationSystemReady());
  
  // Use the separate notification hooks
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
  
  // Set up realtime notifications
  useNotificationRealtime(user, setNotifications, setUnreadCount);
  
  // Set up vacation notifications processing
  const { createNotificationsForPendingRequests } = useVacationNotifications(user, addNotification);
  
  // Filter notifications based on user role
  useEffect(() => {
    if (user && user.role !== 'administrator' && notifications.length > 0) {
      // Filter out notifications about other users' vacations for non-admin users
      const filteredNotifications = notifications.filter(notification => {
        // Keep notifications targeted specifically to this user
        if (notification.targetUserId === user.id) {
          return true;
        }
        
        // If it's a vacation notification and user is not admin, only show if it's their own
        if (notification.type === 'vacation' && !notification.message?.includes(user.name)) {
          return false;
        }
        
        return true;
      });
      
      if (filteredNotifications.length !== notifications.length) {
        console.log(`Filtered out ${notifications.length - filteredNotifications.length} notifications for non-admin user`);
        setNotifications(filteredNotifications);
        
        // Update unread count
        const unreadFiltered = filteredNotifications.filter(n => !n.read).length;
        setUnreadCount(unreadFiltered);
      }
    }
  }, [user, notifications, setNotifications, setUnreadCount]);
  
  // Run once after notifications are fetched to check for missing admin notifications
  useEffect(() => {
    // Only run once per browser session/reload
    if (user?.role === 'administrator' && !loading && notifications.length >= 0 && !systemReadyRef.current) {
      console.log('Checking for any missing admin notifications for pending vacations');
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
