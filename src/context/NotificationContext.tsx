
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { NotificationType } from '@/types/notification';
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

// Dynamic import of the useNotifications hook to avoid circular dependencies
const lazyLoadNotificationsHook = () => {
  return import('../hooks/useNotifications').then(module => module.useNotifications);
};

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // State to track the hook loaded status
  const [hookLoaded, setHookLoaded] = useState(false);
  // State to hold hook data
  const [notificationsData, setNotificationsData] = useState<any>(null);
  const { user } = useAuth();
  const initialFetchDoneRef = useRef(false);
  const sessionFetchDoneRef = useRef(false);
  const sessionId = useRef(generateSessionId());
  
  // Load the hook after component is mounted
  useEffect(() => {
    let mounted = true;
    
    const loadHook = async () => {
      try {
        const useNotificationsHook = await lazyLoadNotificationsHook();
        if (mounted) {
          const hookData = useNotificationsHook();
          setNotificationsData(hookData);
          setHookLoaded(true);
          console.log('Notifications hook loaded successfully');
        }
      } catch (err) {
        console.error("Failed to load notifications hook:", err);
      }
    };
    
    loadHook();
    
    return () => {
      mounted = false;
    };
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
  } = notificationsData || {};
  
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
      hookLoaded,
      hookInitialized: !!notificationsData
    });
  }, [notifications.length, unreadCount, loading, user?.role, hookLoaded]);
  
  // Centralize notification fetching - only fetch once per session
  useEffect(() => {
    if (user && hookLoaded && !sessionFetchDoneRef.current) {
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
  }, [user, fetchNotifications, hookLoaded]);

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
