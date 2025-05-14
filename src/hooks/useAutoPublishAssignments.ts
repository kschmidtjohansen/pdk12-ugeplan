
import { useEffect, useRef } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

/**
 * Hook to automatically publish assignments at a specific time
 */
export const useAutoPublishAssignments = () => {
  const { assignments, loading, updateAssignment: originalUpdateAssignment } = useAssignments();
  const { publishAssignmentsByDate } = useAssignmentPublishing(
    assignments || [], 
    assignment => originalUpdateAssignment(assignment.id, assignment)
  );
  
  const { useAutoPublishScheduler } = useAutoPublishScheduler();
  const { checkAndPublish, lastPublishedDate } = useAutoPublishScheduler({
    assignments,
    loading,
    publishAssignmentsByDate
  });

  // Set up timer to check every minute
  useEffect(() => {
    // Initial check in case the app starts up after 16:00
    checkAndPublish();
    
    // Set interval to check every minute
    const publishTimeoutRef = setInterval(checkAndPublish, 60000);
    
    // Clean up the interval on unmount
    return () => {
      clearInterval(publishTimeoutRef);
    };
  }, [checkAndPublish]);

  return {
    lastPublishedDate,
  };
};

/**
 * Hook to handle the scheduling logic for auto publishing
 */
const useAutoPublishScheduler = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const publishingRef = useRef(false);
  const lastPublishedDateRef = useRef<string | null>(null);

  return {
    useAutoPublishScheduler: ({ 
      assignments, 
      loading, 
      publishAssignmentsByDate 
    }) => {
      // Function to check if it's time to publish
      const checkAndPublish = async () => {
        if (publishingRef.current || loading) {
          return; // Skip if already publishing or assignments are still loading
        }
        
        try {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentDate = format(now, 'yyyy-MM-dd');
          
          // Check if it's 16:00 or later and we haven't published yet today
          if ((currentHour === 16 && currentMinute === 0) || 
              (currentHour > 16 && lastPublishedDateRef.current !== currentDate)) {
            
            console.log('Auto-publish: It\'s 16:00 or later, checking for unpublished assignments');
            
            // Mark as currently publishing to prevent duplicate calls
            publishingRef.current = true;
            
            // Find unpublished assignments for today
            const unpublishedAssignments = assignments?.filter(a => 
              a.date === currentDate && !a.published
            ) || [];
            
            if (unpublishedAssignments.length > 0) {
              console.log(`Auto-publish: Found ${unpublishedAssignments.length} unpublished assignments for today`);
              
              // Publish all unpublished assignments for today
              await publishAssignmentsByDate(currentDate);
              
              // Record that we've published today
              lastPublishedDateRef.current = currentDate;
              
              // Show success notification
              toast({
                title: t('planner.autoPublishSuccess'),
                description: t('planner.autoPublishSuccessMsg', { 
                  count: unpublishedAssignments.length 
                }),
              });
              
              console.log('Auto-publish: Successfully published assignments for today');
            } else {
              console.log('Auto-publish: No unpublished assignments found for today');
            }
          }
        } catch (err) {
          console.error('Error in auto-publish:', err);
        } finally {
          publishingRef.current = false;
        }
      };

      return {
        checkAndPublish,
        lastPublishedDate: lastPublishedDateRef.current
      };
    }
  };
};
