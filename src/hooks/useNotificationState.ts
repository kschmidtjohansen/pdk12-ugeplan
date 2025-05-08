
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationType } from "@/types/notification";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  addNotification as addNotificationService,
  subscribeToNotifications,
  transformNotification
} from "@/services/notificationService";

export const useNotificationState = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch notifications when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      const userNotifications = await fetchNotifications(user.id);
      setNotifications(userNotifications);
    };

    loadNotifications();

    // Set up realtime subscription
    const channel = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show toast for new notification
      toast({
        title: newNotification.title,
        description: newNotification.message,
      });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const addNotification = async (notification: Omit<NotificationType, "id" | "read" | "date">) => {
    if (!user) return;
    
    const newNotification = await addNotificationService(user.id, notification);
    if (newNotification) {
      // We don't need to update the state here as the realtime subscription will handle it
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    const success = await markAllAsRead(user.id);
    if (success) {
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      setNotifications(notifications.filter((notification) => notification.id !== id));
    }
  };

  // Alias for deleteNotification to maintain API compatibility
  const handleClearNotification = async (id: string) => {
    return handleDeleteNotification(id);
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return {
    notifications,
    addNotification,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    clearNotification: handleClearNotification,
    unreadCount,
  };
};
