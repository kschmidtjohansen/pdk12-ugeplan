
import React, { createContext, useContext } from 'react';
import { NotificationType } from '@/types/notification';
import { useNotifications as useNotificationsHook } from '@/hooks/useNotifications';

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

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  deleteAllNotifications: async () => {},
  addNotification: async () => null,
  fetchNotifications: async () => {}
});

// Export the hook for using the notifications context
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Use the notification hook to get all notification functionality
  const notificationHookData = useNotificationsHook();
  
  return (
    <NotificationContext.Provider value={notificationHookData}>
      {children}
    </NotificationContext.Provider>
  );
};
