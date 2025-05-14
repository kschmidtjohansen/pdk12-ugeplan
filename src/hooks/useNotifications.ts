
import { useState, useEffect, useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched notifications:', data);
        
        const formattedNotifications: NotificationType[] = data.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          link: item.link || undefined,
          read: item.read,
          date: new Date(item.created_at)
        }));
        
        // Sort notifications with unread first, then by date
        formattedNotifications.sort(sortNotifications);
        
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Marking all notifications as read');
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);
  
  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      console.log('Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
      
      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Recalculate unread count if needed
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [user, notifications]);
  
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
        if (error.message?.includes('new row violates row-level security policy')) {
          console.error('Permission denied: You do not have permission to create notifications for this user.');
          toast({
            title: "Permission denied",
            description: "You don't have permission to create notifications for this user.",
            variant: "destructive"
          });
        } else {
          console.error('Error inserting notification:', error);
        }
        throw error;
      }
      
      console.log('Notification created successfully:', data);
      
      // If notification is for the current user, update local state
      if (userId === user.id && data && data[0]) {
        const newNotification: NotificationType = {
          id: data[0].id,
          type: data[0].type,
          title: data[0].title,
          message: data[0].message,
          link: data[0].link || undefined,
          read: false,
          date: new Date(data[0].created_at)
        };
        
        // Add to notifications and resort
        setNotifications(prev => {
          const updated = [...prev, newNotification];
          updated.sort(sortNotifications);
          return updated;
        });
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notification
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
      
      return data?.[0]?.id;
    } catch (err) {
      console.error('Error adding notification:', err);
      return null;
    }
  }, [user, toast]);
  
  // Initial fetch on component mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);
  
  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up realtime subscription for notifications');
    
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Received new notification via realtime:', payload);
          
          // A new notification has been inserted
          if (payload.new) {
            const newNotification: NotificationType = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link || undefined,
              read: payload.new.read,
              date: new Date(payload.new.created_at)
            };
            
            console.log('Processing new notification:', newNotification);
            
            // Add to notifications and resort
            setNotifications(prev => {
              const updated = [...prev, newNotification];
              updated.sort(sortNotifications);
              return updated;
            });
            
            // Increment unread count if unread
            if (!payload.new.read) {
              setUnreadCount(prev => prev + 1);
              
              // Show toast for new notification
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });
      
    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
  
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
