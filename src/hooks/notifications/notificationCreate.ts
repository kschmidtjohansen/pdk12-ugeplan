import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  link?: string;
}

export const useNotificationCreate = () => {
  const { currentDepartment } = useDepartment();
  // Track created notifications to prevent duplicates
  const createdNotificationsRef = useRef(new Set<string>());

  const createNotification = async (
    userId: string,
    notification: NotificationData
  ): Promise<any | null> => {
    try {
      if (!currentDepartment) {
        console.error('No current department available for notification');
        return null;
      }

      // Create a hash to track similar notifications
      const notificationHash = `${userId}-${notification.type}-${notification.title}-${notification.message}`;
      
      // Check if we already created this notification in this session
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
            link: notification.link || '',
            read: false,
            department_id: currentDepartment.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      // Mark this notification as created
      createdNotificationsRef.current.add(notificationHash);
      
      // Clean up old hashes periodically to prevent memory leaks
      if (createdNotificationsRef.current.size > 1000) {
        createdNotificationsRef.current.clear();
      }

      console.log(`Successfully created notification for user ${userId}:`, data);
      return data;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  };

  const createBulkNotifications = async (
    userIds: string[],
    notification: NotificationData
  ): Promise<any[]> => {
    try {
      if (!currentDepartment) {
        console.error('No current department available for bulk notifications');
        return [];
      }

      console.log(`Creating bulk notifications for ${userIds.length} users:`, notification);
      
      const notificationData = userIds.map(userId => ({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || '',
        read: false,
        department_id: currentDepartment.id,
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        console.error('Error creating bulk notifications:', error);
        throw error;
      }

      console.log(`Successfully created ${data?.length || 0} bulk notifications`);
      return data || [];
    } catch (error) {
      console.error('Error in createBulkNotifications:', error);
      return [];
    }
  };

  // Clear the deduplication cache when needed
  const clearCache = () => {
    createdNotificationsRef.current.clear();
  };

  return {
    createNotification,
    createBulkNotifications,
    clearCache,
  };
};