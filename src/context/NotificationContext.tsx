
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from './TranslationContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'vacation' | 'assignment' | 'system';
  title: string;
  message: string;
  read: boolean;
  date: Date;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { t } = useTranslation();

  // Load notifications from database
  useEffect(() => {
    if (user) {
      // Fetch notifications from database when the user is logged in
      const fetchNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching notifications:', error);
            return;
          }

          if (data) {
            const formattedNotifications: Notification[] = data.map(n => ({
              id: n.id,
              type: n.type as 'vacation' | 'assignment' | 'system',
              title: n.title,
              message: n.message,
              read: n.read,
              date: new Date(n.created_at),
              link: n.link || undefined
            }));
            
            setNotifications(formattedNotifications);
          }
        } catch (error) {
          console.error('Error in notification fetch:', error);
          
          // Fallback to mock notifications if there's an error
          const mockNotifications: Notification[] = [
            {
              id: '1',
              type: 'vacation',
              title: t('notifications.vacationRequestUpdated'),
              message: t('notifications.vacationApproved'),
              read: false,
              date: new Date(),
              link: '/vacation'
            }
          ];
          
          setNotifications(mockNotifications);
        }
      };

      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, t]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
    if (!user) return;
    
    try {
      // Create new notification in the database
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: false
          }
        ])
        .select();
      
      if (error) {
        console.error('Error creating notification:', error);
        
        // Fall back to local-only notification if database insert fails
        const localNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          read: false,
          date: new Date()
        };
        
        setNotifications(prev => [localNotification, ...prev]);
        return;
      }
      
      if (data && data.length > 0) {
        // Add the new notification to the state
        const newNotification: Notification = {
          id: data[0].id,
          type: data[0].type as 'vacation' | 'assignment' | 'system',
          title: data[0].title,
          message: data[0].message,
          read: data[0].read,
          date: new Date(data[0].created_at),
          link: data[0].link
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (err) {
      console.error('Error in addNotification:', err);
      
      // Fall back to local-only notification if there's an error
      const localNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        read: false,
        date: new Date()
      };
      
      setNotifications(prev => [localNotification, ...prev]);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Update the notification in the database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      // Update the notification in the state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Error in markAsRead:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Update all notifications in the database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }
      
      // Update all notifications in the state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error in markAllAsRead:', err);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      // Delete the notification from the database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }
      
      // Remove the notification from the state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (err) {
      console.error('Error in clearNotification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    try {
      // Delete all notifications from the database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error clearing all notifications:', error);
        return;
      }
      
      // Clear all notifications from the state
      setNotifications([]);
    } catch (err) {
      console.error('Error in clearAllNotifications:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
