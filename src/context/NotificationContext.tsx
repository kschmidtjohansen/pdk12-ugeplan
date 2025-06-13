
import React, { createContext, useContext } from 'react';
import { NotificationType } from '@/types/notification';
import useNotificationsHook from '@/hooks/useNotifications';

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
  deleteAllNotifications: () => Promise<void>;
  addNotification: (
    notification: Omit<NotificationType, 'id' | 'read' | 'date'> & { targetUserId?: string }
  ) => Promise<string | null>;
  fetchNotifications: () => Promise<void>;
}

// Create a safe default context that won't fail if translation is not ready
const defaultContext: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  deleteAllNotifications: async () => {},
  addNotification: async () => null,
  fetchNotifications: async () => {}
};

const NotificationContext = createContext<NotificationContextType>(defaultContext);

// Export the hook for using the notifications context
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Use a try-catch wrapper to prevent provider initialization errors from cascading
  let notificationHookData;
  
  try {
    // Use the notification hook to get all notification functionality
    notificationHookData = useNotificationsHook();
  } catch (error) {
    // If there's an error during hook initialization, use default values
    console.warn('[NotificationProvider] Error initializing notification hook, using defaults:', error);
    notificationHookData = defaultContext;
  }
  
  return (
    <NotificationContext.Provider value={notificationHookData}>
      {children}
    </NotificationContext.Provider>
  );
};
