
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationState } from './notifications/notificationState';
import { useNotificationFetchingOptimized } from './notifications/notificationFetchingOptimized';
import { useNotificationActionsOptimized } from './notifications/notificationActionsOptimized';
import { useNotificationRealtimeOptimized } from './notifications/notificationRealtimeOptimized';
import { useNotificationCreate } from './notifications/notificationCreate';
import { useVacationNotifications } from './notifications/vacationNotifications';

export const useNotificationsOptimized = () => {
  const { user } = useAuth();
  
  const {
    notifications,
    unreadCount,
    loading,
    setLoading,
    updateNotifications,
    addNotificationToState,
    removeNotificationFromState,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useNotificationState();

  const { fetchNotifications } = useNotificationFetchingOptimized(
    user,
    updateNotifications,
    setLoading
  );

  const {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotificationActionsOptimized(
    user,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotificationFromState,
    updateNotifications
  );

  const { addNotification } = useNotificationCreate(user, addNotificationToState, () => {});

  useNotificationRealtimeOptimized(user, addNotificationToState, fetchNotifications);

  const { createNotificationsForPendingRequests } = useVacationNotifications(user, addNotification);

  // Initial fetch
  useEffect(() => {
    if (user) {
      console.log('[useNotificationsOptimized] Initial fetch for user:', user.id);
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  // Admin vacation notification check - only once per session
  useEffect(() => {
    if (user?.role === 'administrator' && !loading && notifications.length >= 0) {
      console.log('[useNotificationsOptimized] Checking for missing admin notifications');
      createNotificationsForPendingRequests();
    }
  }, [user?.role, loading, createNotificationsForPendingRequests]);

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
