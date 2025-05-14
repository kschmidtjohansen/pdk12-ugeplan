
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationFetching } from './notifications/notificationFetching';
import { useNotificationActions } from './notifications/notificationActions'; 
import { useNotificationCreate } from './notifications/notificationCreate';
import { useNotificationRealtime } from './notifications/notificationRealtime';
import { useVacationNotifications } from './notifications/vacationNotifications';

export const useNotifications = () => {
  const { user } = useAuth();
  
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
    deleteNotification 
  } = useNotificationActions(user, notifications, setNotifications, setUnreadCount);
  
  const { addNotification } = useNotificationCreate(user, setNotifications, setUnreadCount);
  
  // Set up realtime notifications
  useNotificationRealtime(user, setNotifications, setUnreadCount);
  
  // Set up vacation notifications processing
  const { createNotificationsForPendingRequests } = useVacationNotifications(user, addNotification);
  
  // Initial fetch on component mount
  useEffect(() => {
    if (user) {
      console.log(`Initial notification fetch triggered for user ${user.id} (${user.role})`);
      fetchNotifications();
    } else {
      console.log('No user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications, setNotifications, setUnreadCount]);
  
  // Run once after notifications are fetched to check for missing admin notifications
  useEffect(() => {
    if (user?.role === 'administrator' && !loading && notifications.length >= 0) {
      console.log('Checking for any missing admin notifications for pending vacations');
      createNotificationsForPendingRequests();
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
    addNotification
  };
};
