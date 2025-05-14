
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationFetching } from './notifications/notificationFetching';
import { useNotificationActions } from './notifications/notificationActions'; 
import { useNotificationCreate } from './notifications/notificationCreate';
import { useNotificationRealtime } from './notifications/notificationRealtime';
import { useVacationNotifications } from './notifications/vacationNotifications';
import { NotificationType } from '@/types/notification';

// Key for tracking fetch status in localStorage
const NOTIFICATION_SYSTEM_READY_KEY = "polygon-notification-system-ready";
const NOTIFICATION_FETCHED_KEY = "polygon-notification-fetched";
const NOTIFICATION_SESSION_KEY = "polygon-notification-session";

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

// Generate a unique session ID for this browser tab
const generateSessionId = (): string => {
  try {
    let sessionId = localStorage.getItem(NOTIFICATION_SESSION_KEY);
    if (!sessionId) {
      sessionId = `notification-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(NOTIFICATION_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (err) {
    return `notification-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const systemReadyRef = useRef<boolean>(isNotificationSystemReady());
  
  // State management
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialFetchDone, setInitialFetchDone] = useState<boolean>(false);
  const [sessionFetchDone, setSessionFetchDone] = useState<boolean>(false);
  const sessionId = useRef(generateSessionId());
  
  // Use the separate notification hooks with try/catch for safety
  const { fetchNotifications, fetchError } = useNotificationFetching(
    user,
    setNotifications,
    setUnreadCount,
    setLoading,
    sessionId.current,
    setInitialFetchDone,
    setSessionFetchDone
  );
  
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
