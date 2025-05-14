
import { useCallback, useRef } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

// Key for localStorage to track notifications created across browser sessions
const NOTIFICATION_CREATED_KEY = "polygon-notification-created";

// Get previously created notification content hashes
const getCreatedNotificationHashes = (): Set<string> => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_CREATED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (err) {
    console.error("Error reading created notification history from localStorage:", err);
    return new Set();
  }
};

// Save a notification content hash to localStorage
const saveCreatedNotificationHash = (hash: string): void => {
  try {
    const hashes = getCreatedNotificationHashes();
    hashes.add(hash);
    localStorage.setItem(NOTIFICATION_CREATED_KEY, JSON.stringify(Array.from(hashes)));
  } catch (err) {
    console.error("Error saving notification hash to localStorage:", err);
  }
};

// Generate a hash for notification content to identify duplicates
const hashNotification = (notification: Omit<NotificationType, 'id' | 'read' | 'date'> & { targetUserId?: string }): string => {
  const userId = notification.targetUserId || '';
  return `${userId}:${notification.type}:${notification.title}:${notification.message || ''}`;
};

export const useNotificationCreate = (
  user: any | null,
  setNotifications: (notifications: NotificationType[] | ((prev: NotificationType[]) => NotificationType[])) => void,
  setUnreadCount: (count: number | ((prev: number) => number)) => void
) => {
  const { toast } = useToast();
  // Use localStorage-backed tracking to prevent duplicate creations
  const createdNotificationsRef = useRef<Set<string>>(getCreatedNotificationHashes());

  // Add a new notification
  const addNotification = useCallback(async (
    notification: Omit<NotificationType, 'id' | 'read' | 'date'> & { targetUserId?: string }
  ) => {
    if (!user) {
      console.error('Cannot add notification: No authenticated user');
      return null;
    }
    
    try {
      // Use the provided target user ID or the current user's ID
      const userId = notification.targetUserId || user.id;
      
      // Generate a content hash to identify duplicates
      const notificationHash = hashNotification(notification);
      
      // Check if we've already created this notification
      if (createdNotificationsRef.current.has(notificationHash)) {
        console.log('Similar notification already created, skipping:', notification);
        return null;
      }
      
      console.log(`Creating notification for user ${userId}:`, notification);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: false
          }
        ])
        .select();
      
      if (error) {
        // Specific handling for RLS policy violations
        if (error.message?.includes('violates row-level security policy')) {
          console.error('Permission denied: You do not have permission to create notifications for this user.');
          console.log('This is likely due to RLS policies. Please check that you have the correct permissions.');
          
          // Only show toast for user-facing operations, not background processes
          if (!notification.targetUserId || notification.targetUserId === user.id) {
            toast({
              title: "Permission denied",
              description: "You don't have permission to create notifications for this user.",
              variant: "destructive"
            });
          }
          return null;
        } else {
          console.error('Error inserting notification:', error);
        }
        return null;
      }
      
      console.log('Notification created successfully:', data);
      
      // Track that we've created this notification
      createdNotificationsRef.current.add(notificationHash);
      saveCreatedNotificationHash(notificationHash);
      
      // If notification is for the current user, update local state
      if (userId === user.id && data && data[0]) {
        const notificationId = data[0].id;
        const newNotification: NotificationType = {
          id: notificationId,
          type: data[0].type,
          title: data[0].title,
          message: data[0].message,
          link: data[0].link || undefined,
          read: false,
          date: new Date(data[0].created_at)
        };
        
        // Add to notifications and resort
        setNotifications((prev: NotificationType[]) => {
          const updated = [...prev, newNotification];
          updated.sort(sortNotifications);
          return updated;
        });
        
        // Increment unread count
        setUnreadCount((prev: number) => prev + 1);
        
        // Toast will be handled by the realtime subscription
      }
      
      return data?.[0]?.id;
    } catch (err) {
      console.error('Error adding notification:', err);
      return null;
    }
  }, [user, toast, setNotifications, setUnreadCount]);

  return {
    addNotification
  };
};
