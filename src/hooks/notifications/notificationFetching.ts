
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationType } from '@/types/notification';
import { AppUser } from '@/context/AuthContext';

// Remove direct dependency on toast to avoid initialization issues
export const useNotificationFetching = (
  user: AppUser | null, 
  setNotifications: (notifications: NotificationType[]) => void,
  setUnreadCount: (count: number) => void,
  setLoading: (loading: boolean) => void,
  sessionId: string,
  setInitialFetchDone: (done: boolean) => void,
  setSessionFetchDone: (done: boolean) => void
) => {
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Function to fetch notifications for the current user
  const fetchNotifications = async () => {
    if (!user || !user.id) {
      console.log('No user available to fetch notifications');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setFetchError(error.message);
        return;
      }

      console.log(`Fetched ${data?.length} notifications`);
      
      if (data) {
        // Transform the Supabase data to match NotificationType
        const transformedData: NotificationType[] = data.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          link: item.link || undefined,
          read: item.read,
          date: new Date(item.created_at)
        }));
        
        setNotifications(transformedData);
        
        // Count unread notifications
        const unreadCount = data.filter((notification) => !notification.read).length;
        setUnreadCount(unreadCount);
        console.log(`Unread count: ${unreadCount}`);
      }
    } catch (error) {
      console.error('Unexpected error fetching notifications:', error);
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
    }
  };

  // Effect to fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      // Clear notifications when user is not available
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Return the fetching function for manual refreshes
  return { fetchNotifications, fetchError };
};
