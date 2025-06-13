
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { NotificationType } from '@/types/notification';

const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { t } = useTranslation();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform database data to match NotificationType
      const transformedNotifications: NotificationType[] = (data || []).map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        date: new Date(notification.created_at)
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read).length);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification: NotificationType = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link,
              read: payload.new.read,
              date: new Date(payload.new.created_at)
            };
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification: NotificationType = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link,
              read: payload.new.read,
              date: new Date(payload.new.created_at)
            };
            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
            );
            setUnreadCount(prev => prev.filter(n => !n.read).length);
          } else if (payload.eventType === 'DELETE') {
            const deletedNotificationId = payload.old?.id as string;
            setNotifications(prev => prev.filter(n => n.id !== deletedNotificationId));
            setUnreadCount(prev => prev.filter(n => !n.read).length);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      setError(err.message || 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => prev.filter(n => !n.read).length);
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
    }
  };

  const createAssignmentNotification = async (assignment: Assignment, targetUser: { id: string; name?: string }) => {
    if (!assignment || !targetUser?.id) return;

    try {
      const userName = targetUser.name || user?.user_metadata?.name || user?.email || 'Unknown User';
      
      const notificationData = {
        user_id: targetUser.id,
        type: 'assignment',
        title: t('notifications.newAssignment'),
        message: t('notifications.assignedTo', { 
          assignment: assignment.title, 
          user: userName 
        }),
        link: '/planner'
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notificationData]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating assignment notification:', error);
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createAssignmentNotification
  };
};

export default useNotifications;
