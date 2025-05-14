
import { useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';
import { toast } from '@/hooks/use-toast';

// Key for localStorage to track vacation notification processing
const PROCESSED_VACATION_IDS_KEY = "polygon-processed-vacation-ids";

// Get already processed vacation IDs from localStorage
const getProcessedVacationIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(PROCESSED_VACATION_IDS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (err) {
    console.error("Error reading processed vacation IDs from localStorage:", err);
    return new Set();
  }
};

// Save processed vacation IDs to localStorage
const saveProcessedVacationId = (id: string): void => {
  try {
    const ids = getProcessedVacationIds();
    ids.add(id);
    localStorage.setItem(PROCESSED_VACATION_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error("Error saving processed vacation ID to localStorage:", err);
  }
};

// Clear all processed vacation IDs
const clearProcessedVacationIds = (): void => {
  try {
    localStorage.removeItem(PROCESSED_VACATION_IDS_KEY);
    console.log("Cleared processed vacation IDs from localStorage");
  } catch (err) {
    console.error("Error clearing processed vacation IDs from localStorage:", err);
  }
};

export const useVacationNotifications = (
  user: any | null,
  addNotification: (notification: any) => Promise<string | null>
) => {
  const { t, currentLanguage } = useTranslation();
  
  // Use localStorage-backed tracking to prevent duplicate notifications
  const processedVacationIdsRef = useRef<Set<string>>(getProcessedVacationIds());
  
  // Create notifications for pending vacation requests
  const createNotificationsForPendingRequests = useCallback(async (forceRefresh: boolean = false) => {
    // Only run for administrators
    if (!user || user.role !== 'administrator') {
      console.log('Not an admin user, skipping vacation notification check');
      return;
    }
    
    try {
      console.log('Checking for pending vacation requests that need notifications...');
      
      // If force refresh is requested, clear the processed IDs
      if (forceRefresh) {
        clearProcessedVacationIds();
        processedVacationIdsRef.current = new Set();
        console.log('Forced refresh: cleared all processed vacation IDs');
      }
      
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
      
      // Track notifications we create in this batch
      let createdCount = 0;
      let skippedCount = 0;
      
      // Create notifications for pending requests if needed
      for (const vacation of pendingVacations) {
        // Skip if already processed in any previous session
        if (processedVacationIdsRef.current.has(vacation.id)) {
          console.log(`Already processed vacation ${vacation.id}, skipping`);
          skippedCount++;
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
            
            // Mark as processed
            if (notificationId) {
              processedVacationIdsRef.current.add(vacation.id);
              saveProcessedVacationId(vacation.id);
              createdCount++;
              console.log(`Created notification for pending request:`, notificationId);
            }
          } catch (notifErr) {
            console.error('Error creating notification for pending request:', notifErr);
          }
        } else {
          // Mark as processed to avoid checking again
          processedVacationIdsRef.current.add(vacation.id);
          saveProcessedVacationId(vacation.id);
          skippedCount++;
          console.log(`Notification already exists for vacation ${vacation.id}, skipping`);
        }
      }
      
      console.log(`Vacation notification processing complete - Created: ${createdCount}, Skipped: ${skippedCount}`);
      
      // If we force refreshed and created new notifications, show a toast
      if (forceRefresh && createdCount > 0) {
        toast({
          title: t('notifications.processingComplete'),
          description: `${createdCount} new notification(s) created`,
        });
      }
    } catch (err) {
      console.error('Error checking for pending vacation requests:', err);
    }
  }, [user, t, currentLanguage, addNotification]);

  // Run when user becomes an admin
  useEffect(() => {
    if (user?.role === 'administrator') {
      console.log('Admin user detected, checking for pending vacation notifications');
      createNotificationsForPendingRequests();
    }
  }, [user?.role, createNotificationsForPendingRequests]);

  return {
    createNotificationsForPendingRequests
  };
};
