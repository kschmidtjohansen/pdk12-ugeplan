
import { useState, useCallback } from 'react';
import { NotificationType } from '@/types/notification';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { sortNotifications } from '@/utils/notifications';

export const useNotificationFetching = (user: any | null) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Safely get translation context, return null if not available
  let t: ((key: string) => string) | null = null;
  try {
    const translation = useTranslation();
    t = translation.t;
  } catch (error) {
    // Translation provider not ready yet, this is fine
    t = null;
  }

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      if (import.meta.env.DEV) console.log('No user found, skipping notification fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      if (import.meta.env.DEV) console.log(`Fetching notifications for user ${user.id}`);
      
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
        if (import.meta.env.DEV) console.log(`Fetched ${data.length} notifications`);
        
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
  }, [user, toast, t]);

  return {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    loading,
    fetchNotifications
  };
};
