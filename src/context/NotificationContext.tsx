
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useNotifications as useNotificationsHook } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

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

// Export the hook for using the notifications context
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Use the notification hook to get all notification functionality
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    fetchNotifications
  } = useNotificationsHook();
  
  const { user } = useAuth();
  const initialFetchDoneRef = useRef(false);
  
  // Debug log when provider updates
  useEffect(() => {
    console.log('NotificationProvider state updated:', {
      userRole: user?.role,
      notificationCount: notifications.length,
      unreadCount,
      loading,
      initialFetchDone: initialFetchDoneRef.current
    });
  }, [notifications.length, unreadCount, loading, user?.role]);
  
  // Fetch notifications when the user changes, but only once per session
  useEffect(() => {
    if (user && !initialFetchDoneRef.current) {
      console.log(`NotificationProvider: Initial fetch for user ${user.id} (${user.role})`);
      fetchNotifications();
      initialFetchDoneRef.current = true;
    } else if (!user) {
      // Reset flag if user logs out
      initialFetchDoneRef.current = false;
    }
  }, [user, fetchNotifications]);

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
