
import { useEffect, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/hooks/use-toast';
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
    if (import.meta.env.DEV) console.error("Error reading notification history from localStorage:", err);
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
    if (import.meta.env.DEV) console.error("Error saving notification history to localStorage:", err);
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
    if (import.meta.env.DEV) console.error("Error saving notification channel to localStorage:", err);
  }
};

// Clear active channel marker
const clearActiveChannel = (): void => {
  try {
    localStorage.removeItem(NOTIFICATION_CHANNEL_KEY);
  } catch (err) {
    if (import.meta.env.DEV) console.error("Error removing notification channel from localStorage:", err);
  }
};

export const useNotificationRealtime = (
  user: any | null,
  setNotifications: (updater: (prev: NotificationType[]) => NotificationType[]) => void,
  setUnreadCount: (updater: (prev: number) => number) => void
) => {
  const { toast } = useToast();
  const shownNotificationsRef = useRef<Set<string>>(getShownNotificationIds());
  const channelRef = useRef<any>(null);
  const previousUserIdRef = useRef<string | null>(null);

  const cleanupChannel = () => {
    if (channelRef.current) {
      if (import.meta.env.DEV) console.log('Cleaning up notification subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      clearActiveChannel();
    }
  };

  useEffect(() => {
    if (!user) {
      if (import.meta.env.DEV) console.log('No user, skipping real-time subscription');
      previousUserIdRef.current = null;
      return cleanupChannel();
    }
    
    if (previousUserIdRef.current === user.id && channelRef.current) {
      if (import.meta.env.DEV) console.log('Already subscribed to notifications, skipping');
      return;
    }
    
    previousUserIdRef.current = user.id;
    cleanupChannel();
    
    const existingChannel = getActiveChannel();
    if (existingChannel) {
      if (import.meta.env.DEV) console.log('Using existing notification channel');
      return;
    }
    
    const channelName = `notification_changes_${user.id}_${Math.random().toString(36).substring(2, 9)}`;
    if (import.meta.env.DEV) console.log('Setting up realtime subscription:', channelName);
    
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
          if (import.meta.env.DEV) console.log('Received new notification via realtime');
          
          if (payload.new) {
            const notificationId = payload.new.id;
            
            if (shownNotificationsRef.current.has(notificationId)) {
              if (import.meta.env.DEV) console.log('Notification already processed, skipping');
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
            
            setNotifications((prev: NotificationType[]) => {
              if (prev.some(n => n.id === newNotification.id)) {
                if (import.meta.env.DEV) console.log('Notification already exists in state, skipping');
                return prev;
              }
              
              const updated = [...prev, newNotification];
              updated.sort(sortNotifications);
              return updated;
            });
            
            if (!payload.new.read) {
              setUnreadCount((prev: number) => prev + 1);
              
              shownNotificationsRef.current.add(notificationId);
              saveShownNotificationId(notificationId);
              
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
              
              if (import.meta.env.DEV) console.log('Toast shown for notification:', notificationId);
            }
          }
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) console.log('Notification subscription status:', status);
      });
      
    channelRef.current = channel;
      
    return cleanupChannel;
  }, [user, toast, setNotifications, setUnreadCount]);
};