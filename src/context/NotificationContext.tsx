
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { NotificationType } from "@/types/notification";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { InsertNotification, TableNotification } from "@/types/supabase";

interface NotificationContextType {
  notifications: NotificationType[];
  addNotification: (notification: Omit<NotificationType, "id" | "read" | "date">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch notifications from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform to our NotificationType interface
        const transformedNotifications: NotificationType[] = data.map((n: TableNotification) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link || undefined,
          read: n.read,
          date: new Date(n.created_at)
        }));

        setNotifications(transformedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as TableNotification;
        
        const transformedNotification: NotificationType = {
          id: newNotification.id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          link: newNotification.link || undefined,
          read: newNotification.read,
          date: new Date(newNotification.created_at)
        };
        
        setNotifications(prev => [transformedNotification, ...prev]);
        
        // Show toast for new notification
        toast({
          title: transformedNotification.title,
          description: transformedNotification.message,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const addNotification = async (notification: Omit<NotificationType, "id" | "read" | "date">) => {
    if (!user) return;
    
    try {
      // Prepare notification data for Supabase
      const notificationData: InsertNotification = {
        user_id: user.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        read: false
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // No need to manually update state here as we're listening for changes
        // via the realtime subscription
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Update all user's notifications in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications(notifications.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
