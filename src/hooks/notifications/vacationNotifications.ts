
import { useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';

export const useVacationNotifications = (
  user: any | null,
  addNotification: (notification: any) => Promise<string | null>
) => {
  const { t, currentLanguage } = useTranslation();
  // Use a ref to track if we've already checked for notifications in this session
  const hasCheckedRef = useRef(false);
  
  // Also track vacation IDs we've already processed
  const processedVacationIdsRef = useRef<Set<string>>(new Set());
  
  // Create notifications for pending vacation requests
  const createNotificationsForPendingRequests = useCallback(async () => {
    // Only run for administrators
    if (!user || user.role !== 'administrator') {
      return;
    }
    
    // Skip if we've already checked in this session
    if (hasCheckedRef.current) {
      console.log('Already checked for pending vacation notifications in this session, skipping');
      return;
    }
    
    try {
      console.log('Checking for missing admin notifications for pending vacation requests...');
      
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
        hasCheckedRef.current = true; // Mark as checked even if none found
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
      
      // Check if we already have notifications for these pending requests
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
        // Skip if we've already processed this vacation in this session
        if (processedVacationIdsRef.current.has(vacation.id)) {
          console.log(`Already processed vacation ${vacation.id} in this session, skipping`);
          continue;
        }
        
        // Get employee name from our mapping
        const employeeName = profileNameMap.get(vacation.user_id) || 'Employee';
        
        // Check if we already have a notification for this vacation
        const hasNotification = existingNotifications?.some(n => 
          n.message?.includes(employeeName) && 
          n.message?.includes(vacation.start_date) &&
          n.message?.includes(vacation.end_date)
        );
        
        if (!hasNotification) {
          console.log(`Creating notification for pending vacation request from ${employeeName}`);
          
          const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
          const formattedStartDate = format(new Date(vacation.start_date), dateFormat);
          const formattedEndDate = format(new Date(vacation.end_date), dateFormat);
          
          const notifyMessage = t('notifications.newVacationRequestActionRequired', {
            name: employeeName,
            from: formattedStartDate,
            to: formattedEndDate
          });
          
          try {
            // Add notification using the context
            const notificationId = await addNotification({
              type: 'vacation',
              title: t('notifications.newVacationRequest'),
              message: notifyMessage,
              link: '/vacation'
            });
            
            // Mark as processed regardless of success to avoid spamming
            processedVacationIdsRef.current.add(vacation.id);
            console.log(`Created notification for pending request:`, notificationId);
          } catch (notifErr) {
            console.error('Error creating notification for pending request:', notifErr);
          }
        } else {
          // Mark as processed to avoid checking again
          processedVacationIdsRef.current.add(vacation.id);
          console.log(`Notification already exists for vacation ${vacation.id}, skipping`);
        }
      }
      
      // Mark that we've checked for notifications in this session
      hasCheckedRef.current = true;
    } catch (err) {
      console.error('Error checking for pending vacation requests:', err);
    }
  }, [user, t, currentLanguage, addNotification]);

  // Run when component mounts, but only once
  useEffect(() => {
    if (user?.role === 'administrator' && !hasCheckedRef.current) {
      console.log('Admin user detected, checking for pending vacation notifications');
      createNotificationsForPendingRequests();
    }
  }, [user, createNotificationsForPendingRequests]);

  return {
    createNotificationsForPendingRequests
  };
};
