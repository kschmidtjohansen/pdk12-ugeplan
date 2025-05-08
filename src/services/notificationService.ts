
import { supabase } from "@/integrations/supabase/client";
import { NotificationType } from "@/types/notification";
import { InsertNotification, TableNotification } from "@/types/supabase";

/**
 * Transform a TableNotification to NotificationType
 */
export const transformNotification = (n: TableNotification): NotificationType => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message,
  link: n.link || undefined,
  read: n.read,
  date: new Date(n.created_at)
});

/**
 * Fetch notifications for a user
 */
export const fetchNotifications = async (userId: string): Promise<NotificationType[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform to our NotificationType interface
    return data.map((n: TableNotification) => transformNotification(n));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Add a new notification
 */
export const addNotification = async (
  userId: string,
  notification: Omit<NotificationType, "id" | "read" | "date">
): Promise<NotificationType | null> => {
  try {
    // Prepare notification data for Supabase
    const notificationData: InsertNotification = {
      user_id: userId,
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
      return transformNotification(data[0] as TableNotification);
    }
    
    return null;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Set up realtime subscription for new notifications
 */
export const subscribeToNotifications = (
  userId: string,
  onNewNotification: (notification: NotificationType) => void
) => {
  const channel = supabase
    .channel('notifications-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      const newNotification = payload.new as TableNotification;
      const transformedNotification = transformNotification(newNotification);
      onNewNotification(transformedNotification);
    })
    .subscribe();
  
  return channel;
};
