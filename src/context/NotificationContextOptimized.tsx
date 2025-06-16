
import React, { createContext, useContext } from 'react';
import { NotificationType } from '@/types/notification';
import { useNotificationsOptimized } from '@/hooks/useNotificationsOptimized';

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

const NotificationContextOptimized = createContext<NotificationContextType>(defaultContext);

export const useNotifications = () => useContext(NotificationContextOptimized);

export const NotificationProviderOptimized: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const notificationData = useNotificationsOptimized();
  
  return (
    <NotificationContextOptimized.Provider value={notificationData}>
      {children}
    </NotificationContextOptimized.Provider>
  );
};
