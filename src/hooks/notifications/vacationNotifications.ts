
import { useCallback } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

export const useVacationNotifications = (
  user: any | null,
  addNotification: (notification: any) => Promise<string | null>
) => {
  const { t, currentLanguage } = useTranslation();
  
  // Create notifications for pending vacation requests
  const createNotificationsForPendingRequests = useCallback(async () => {
    // Only run for administrators
    if (!user || user.role !== 'administrator') {
      console.log('Not an admin user, skipping vacation notification check');
      return;
    }
    
    try {
      console.log('Checking for pending vacation requests that need notifications...');
      
      const { data: pendingVacations, error } = await supabase
        .from('vacations')
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          reason,
          status
        `)
        .eq('status', 'pending');
        
      if (error) {
        console.error('Error fetching pending vacations:', error);
        return;
      }
      
      if (!pendingVacations || pendingVacations.length === 0) {
        console.log('No pending vacation requests found');
        return;
      }
      
      console.log(`Found ${pendingVacations.length} pending vacation requests:`, pendingVacations);
      
      // Fetch employee names for these vacations
      const userIds = pendingVacations.map(v => v.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching employee profiles:', profilesError);
      }
      
      // Create a mapping of user IDs to names
      const profileNameMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileNameMap.set(profile.id, profile.name);
        });
      }
      
      // Check existing notifications - only check for unread vacation notifications
      const { data: existingNotifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'vacation')
        .eq('read', false);
        
      if (notifError) {
        console.error('Error checking existing notifications:', notifError);
        return;
      }
      
      console.log(`Found ${existingNotifications?.length || 0} existing unread vacation notifications`);
      
      // Create notifications for pending requests if needed
      for (const vacation of pendingVacations) {
        const employeeName = profileNameMap.get(vacation.user_id) || 'Employee';
        
        const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
        const formattedStartDate = format(new Date(vacation.start_date), dateFormat);
        const formattedEndDate = format(new Date(vacation.end_date), dateFormat);
        
        // Check if we already have a notification for this specific vacation request
        const hasNotification = existingNotifications?.some(n => {
          return n.message?.includes(employeeName) && 
                n.message?.includes(formattedStartDate) &&
                n.message?.includes(formattedEndDate);
        });
        
        if (!hasNotification) {
          console.log(`Creating notification for pending vacation request from ${employeeName}`);
          
          const notifyMessage = t('notifications.newVacationRequestActionRequired', {
            name: employeeName,
            from: formattedStartDate,
            to: formattedEndDate
          });
          
          try {
            const notificationId = await addNotification({
              type: 'vacation',
              title: t('notifications.newVacationRequest'),
              message: notifyMessage,
              link: '/vacation'
            });
            
            console.log(`Created notification for pending request:`, notificationId);
          } catch (notifErr) {
            console.error('Error creating notification for pending request:', notifErr);
          }
        } else {
          console.log(`Notification already exists for vacation ${vacation.id}, skipping`);
        }
      }
    } catch (err) {
      console.error('Error checking for pending vacation requests:', err);
    }
  }, [user, t, currentLanguage, addNotification]);

  return {
    createNotificationsForPendingRequests
  };
};
