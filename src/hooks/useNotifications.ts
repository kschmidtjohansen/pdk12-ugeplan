
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationFetching } from './notifications/notificationFetching';
import { useNotificationActions } from './notifications/notificationActions'; 
import { useNotificationCreate } from './notifications/notificationCreate';
import { useNotificationRealtime } from './notifications/notificationRealtime';
import { useVacationNotifications } from './notifications/vacationNotifications';
import { useNotificationReset } from './notifications/useNotificationReset';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

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
  const { toast } = useToast();
  const { t } = useTranslation();
  const [initializing, setInitializing] = useState<boolean>(true);
  const systemReadyRef = useRef<boolean>(isNotificationSystemReady());
  
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
  
  // Reset functionality
  const { resetProcessedVacationNotifications } = useNotificationReset();
  
  // Set up realtime notifications
  useNotificationRealtime(user, setNotifications, setUnreadCount);
  
  // Set up vacation notifications processing
  const { createNotificationsForPendingRequests } = useVacationNotifications(user, addNotification);
  
  // Function to manually refresh admin notifications
  const refreshAdminNotifications = async () => {
    if (user?.role !== 'administrator') {
      console.error('Only administrators can refresh admin notifications');
      return;
    }
    
    toast({
      title: t('notifications.processingNotifications'),
      description: t('notifications.reset')
    });
    
    // Reset processed IDs and force refresh
    await resetProcessedVacationNotifications();
    
    // Force refetch pending vacations and create notifications
    await createNotificationsForPendingRequests(true);
  };
  
  // Run once after notifications are fetched to check for missing admin notifications
  useEffect(() => {
    // Only run once per browser session/reload
    if (user?.role === 'administrator' && !loading && notifications.length >= 0 && !systemReadyRef.current) {
      console.log('Checking for any missing admin notifications for pending vacations');
      createNotificationsForPendingRequests();
      systemReadyRef.current = true;
      markNotificationSystemReady();
      setInitializing(false);
    } else if (!loading) {
      // For non-admins, just mark as not initializing
      setInitializing(false);
    }
  }, [user, loading, notifications.length, createNotificationsForPendingRequests]);
  
  return {
    notifications,
    unreadCount,
    loading,
    initializing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refreshAdminNotifications
  };
};
