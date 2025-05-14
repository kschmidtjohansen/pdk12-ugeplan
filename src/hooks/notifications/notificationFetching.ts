
import { useState, useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

export const useNotificationFetching = (user: any | null) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Wrap toast in a try-catch to avoid errors if toast context isn't ready
  let toast;
  try {
    toast = useToast().toast;
  } catch (e) {
    // Silent fallback if toast is not available
    toast = () => console.log('Toast not available yet');
  }
  
  const { t } = useTranslation();

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping notification fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching notifications for user ${user.id} with role ${user.role}`);
      
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
        console.log(`Fetched ${data.length} notifications for user ${user.id}:`, data);
        
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
  }, [user, t]);

  return {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    loading,
    fetchNotifications
  };
};
