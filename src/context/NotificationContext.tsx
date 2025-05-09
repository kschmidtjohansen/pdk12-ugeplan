
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
  const { t } = useTranslation();
  const { user } = useAuth();

  // For now, let's use mock notifications until the notifications table is created
  useEffect(() => {
    if (user) {
      // Mock notifications for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'vacation',
          title: t('notifications.vacationRequestUpdated'),
          message: t('notifications.vacationApproved'),
          read: false,
          date: new Date(),
          link: '/vacation'
        },
        {
          id: '2',
          type: 'assignment',
          title: t('notifications.newAssignment'),
          message: t('notifications.assignmentDetails'),
          read: true,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          link: '/planner'
        }
      ];
      
      setNotifications(mockNotifications);
    } else {
      setNotifications([]);
    }
  }, [user, t]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
    // For now, add locally until db table is created
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      date: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = async (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
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
