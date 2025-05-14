
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
  
  // Use the separate notification hooks with try/catch for safety
  let notificationFetchingData;
  try {
    notificationFetchingData = useNotificationFetching(user);
  } catch (error) {
    console.error("Error initializing notification fetching:", error);
    // Provide fallback default values if the hook fails
    notificationFetchingData = {
      notifications: [],
      setNotifications: () => {},
      unreadCount: 0,
      setUnreadCount: () => {},
      loading: false,
      fetchNotifications: async () => {}
    };
  }
  
  const { 
    notifications, 
    setNotifications,
    unreadCount, 
    setUnreadCount,
    loading, 
    fetchNotifications 
  } = notificationFetchingData;
  
  // Safe initialization of other hooks
  let notificationActions;
  try {
    notificationActions = useNotificationActions(user, notifications, setNotifications, setUnreadCount);
  } catch (error) {
    console.error("Error initializing notification actions:", error);
    notificationActions = {
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      deleteNotification: async () => {}
    };
  }
  
  const { 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = notificationActions;
  
  let notificationCreate;
  try {
    notificationCreate = useNotificationCreate(user, setNotifications, setUnreadCount);
  } catch (error) {
    console.error("Error initializing notification create:", error);
    notificationCreate = {
      addNotification: async () => null
    };
  }
  
  const { addNotification } = notificationCreate;
  
  // Set up realtime notifications with try/catch
  try {
    useNotificationRealtime(user, setNotifications, setUnreadCount);
  } catch (error) {
    console.error("Error setting up notification realtime:", error);
  }
  
  // Set up vacation notifications processing with try/catch
  let vacationNotifications;
  try {
    vacationNotifications = useVacationNotifications(user, addNotification);
  } catch (error) {
    console.error("Error initializing vacation notifications:", error);
    vacationNotifications = {
      createNotificationsForPendingRequests: async () => {}
    };
  }
  
  const { createNotificationsForPendingRequests } = vacationNotifications || { 
    createNotificationsForPendingRequests: async () => {} 
  };
  
  // Run once after notifications are fetched to check for missing admin notifications
  useEffect(() => {
    // Only run once per browser session/reload
    if (user?.role === 'administrator' && !loading && notifications?.length >= 0 && !systemReadyRef.current) {
      console.log('Checking for any missing admin notifications for pending vacations');
      try {
        createNotificationsForPendingRequests();
        systemReadyRef.current = true;
        markNotificationSystemReady();
      } catch (error) {
        console.error("Error creating notifications for pending requests:", error);
      }
    }
  }, [user, loading, notifications?.length, createNotificationsForPendingRequests]);
  
  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    loading: loading || false,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };
};
