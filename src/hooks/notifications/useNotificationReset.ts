
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useNotificationReset = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Function to reset all processed vacation notifications
  const resetProcessedVacationNotifications = useCallback(async () => {
    if (!user || user.role !== 'administrator') {
      console.error('Only administrators can reset vacation notifications');
      return false;
    }
    
    try {
      console.log('Resetting processed vacation notifications');
      
      // Clear local storage markers
      localStorage.removeItem("polygon-processed-vacation-ids");
      
      // Force a refetch of pending vacation requests
      toast({
        title: t('notifications.reset'),
        description: t('notifications.notificationsReset'),
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting notifications:', error);
      toast({
        title: t('common.error'),
        description: t('notifications.resetError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, t]);
  
  return { resetProcessedVacationNotifications };
};
