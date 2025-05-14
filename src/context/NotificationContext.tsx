
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useNotifications as useNotificationsHook } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

// Key for tracking initial fetch in localStorage
const NOTIFICATION_FETCHED_KEY = "polygon-notifications-fetched";
const NOTIFICATION_SESSION_KEY = "polygon-notification-session";

interface NotificationContextType {
  notifications: NotificationType[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (
    notification: Omit<NotificationType, 'id' | 'read' | 'date'> & { targetUserId?: string }
  ) => Promise<string | null>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  addNotification: async () => null,
  fetchNotifications: async () => {}
});

// Generate a unique session ID for this browser tab
const generateSessionId = () => {
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

// Export the hook for using the notifications context
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Don't use the hook until we know the provider is mounted
  const notificationsHookRef = useRef<any>(null);
  const { user } = useAuth();
  const initialFetchDoneRef = useRef(false);
  const sessionFetchDoneRef = useRef(false);
  const sessionId = useRef(generateSessionId());
  
  useEffect(() => {
    // Only initialize the hook once we're mounted to ensure ToastProvider is available
    if (!notificationsHookRef.current) {
      try {
        // Now it's safe to use the hook since we're definitely mounted
        // and ToastProvider should be available
        notificationsHookRef.current = useNotificationsHook();
      } catch (err) {
        console.error("Failed to initialize notifications hook:", err);
      }
    }
  }, []);
  
  // If the hook isn't ready yet, provide fallback values
  const {
    notifications = [],
    unreadCount = 0,
    loading = true,
    markAsRead = async () => {},
    markAllAsRead = async () => {},
    deleteNotification = async () => {},
    addNotification = async () => null,
    fetchNotifications = async () => {}
  } = notificationsHookRef.current || {};
  
  // Debug log when provider updates
  useEffect(() => {
    console.log('NotificationProvider state updated:', {
      userRole: user?.role,
      notificationCount: notifications.length,
      unreadCount,
      loading,
      initialFetchDone: initialFetchDoneRef.current,
      sessionFetchDone: sessionFetchDoneRef.current,
      sessionId: sessionId.current,
      hookInitialized: !!notificationsHookRef.current
    });
  }, [notifications.length, unreadCount, loading, user?.role]);
  
  // Centralize notification fetching - only fetch once per session
  useEffect(() => {
    if (user && notificationsHookRef.current && !sessionFetchDoneRef.current) {
      console.log(`NotificationProvider: Initial fetch for user ${user.id} (${user.role}) with session ${sessionId.current}`);
      fetchNotifications();
      
      // Mark as fetched for this session
      sessionFetchDoneRef.current = true;
      
      // Also mark as fetched across app reloads
      if (!initialFetchDoneRef.current) {
        try {
          localStorage.setItem(NOTIFICATION_FETCHED_KEY, 'true');
          initialFetchDoneRef.current = true;
        } catch (err) {
          console.error("Error saving notification fetch status to localStorage:", err);
        }
      }
    } else if (!user) {
      // Reset session flag if user logs out
      sessionFetchDoneRef.current = false;
    }
  }, [user, fetchNotifications, notificationsHookRef.current]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
