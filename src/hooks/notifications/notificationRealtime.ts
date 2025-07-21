
import { useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

// Key for localStorage to track notifications shown across browser sessions
const NOTIFICATION_HISTORY_KEY = "polygon-notification-history";
const NOTIFICATION_CHANNEL_KEY = "polygon-notification-channel";

// Get previously shown notification IDs
const getShownNotificationIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (err) {
    console.error("Error reading notification history from localStorage:", err);
    return new Set();
  }
};

// Save a notification ID to localStorage
const saveShownNotificationId = (id: string): void => {
  try {
    const shownIds = getShownNotificationIds();
    shownIds.add(id);
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(Array.from(shownIds)));
  } catch (err) {
    console.error("Error saving notification history to localStorage:", err);
  }
};

// Track if we already have an active subscription for this user
const getActiveChannel = (): string | null => {
  try {
    return localStorage.getItem(NOTIFICATION_CHANNEL_KEY);
  } catch (err) {
    return null;
  }
};

// Mark that we have an active subscription
const setActiveChannel = (channelId: string): void => {
  try {
    localStorage.setItem(NOTIFICATION_CHANNEL_KEY, channelId);
  } catch (err) {
    console.error("Error saving notification channel to localStorage:", err);
  }
};

// Clear active channel marker
const clearActiveChannel = (): void => {
  try {
    localStorage.removeItem(NOTIFICATION_CHANNEL_KEY);
  } catch (err) {
    console.error("Error removing notification channel from localStorage:", err);
  }
};

export const useNotificationRealtime = (
  user: any | null,
  setNotifications: (updater: (prev: NotificationType[]) => NotificationType[]) => void,
  setUnreadCount: (updater: (prev: number) => number) => void
) => {
  const { toast } = useToast();
  // Use localStorage-backed tracking to prevent duplicate toasts across sessions
  const shownNotificationsRef = useRef<Set<string>>(getShownNotificationIds());
  
  // Track active channel to avoid duplicate subscriptions
  const channelRef = useRef<any>(null);
  const previousUserIdRef = useRef<string | null>(null);

  // Clean up function to remove channel subscription
  const cleanupChannel = () => {
    if (channelRef.current) {
      console.log(`Cleaning up notification subscription`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      clearActiveChannel();
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) {
      console.log('No user, skipping real-time subscription');
      previousUserIdRef.current = null;
      return cleanupChannel();
    }
    
    // Don't resubscribe for the same user
    if (previousUserIdRef.current === user.id && channelRef.current) {
      console.log(`Already subscribed to notifications for user ${user.id}, skipping`);
      return;
    }
    
    // Update previous user ID
    previousUserIdRef.current = user.id;
    
    // Clean up any existing subscription to avoid duplicates
    cleanupChannel();
    
    // Check if we already have a channel active in another tab/window
    const existingChannel = getActiveChannel();
    if (existingChannel) {
      console.log(`Using existing notification channel: ${existingChannel}`);
      return;
    }
    
    // Create a unique channel name for this user and instance
    const channelName = `notification_changes_${user.id}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Setting up realtime subscription for notifications using channel: ${channelName}`);
    
    // Set as active channel
    setActiveChannel(channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log(`Received new notification via realtime for user ${user.id}:`, payload);
          
          // A new notification has been inserted
          if (payload.new) {
            const notificationId = payload.new.id;
            
            // Check if we've already processed this notification in this session
            if (shownNotificationsRef.current.has(notificationId)) {
              console.log('Notification already processed in this session, skipping:', notificationId);
              return;
            }
            
            const newNotification: NotificationType = {
              id: notificationId,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link || undefined,
              read: payload.new.read,
              date: new Date(payload.new.created_at)
            };
            
            // Add to notifications and resort
            setNotifications((prev: NotificationType[]) => {
              // Check if notification already exists to prevent duplicates
              if (prev.some(n => n.id === newNotification.id)) {
                console.log('Notification already exists in state, skipping');
                return prev;
              }
              
              const updated = [...prev, newNotification];
              updated.sort(sortNotifications);
              return updated;
            });
            
            // Increment unread count if unread
            if (!payload.new.read) {
              setUnreadCount((prev: number) => prev + 1);
              
              // Mark this notification as shown
              shownNotificationsRef.current.add(notificationId);
              saveShownNotificationId(notificationId);
              
              // Show toast for new notification
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
              
              console.log('Toast shown for notification:', notificationId);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Notification subscription status for user ${user.id}:`, status);
      });
      
    // Store the channel reference for cleanup
    channelRef.current = channel;
      
    return cleanupChannel;
  }, [user, toast, setNotifications, setUnreadCount]);
};
