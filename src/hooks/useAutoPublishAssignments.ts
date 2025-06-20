
import { useEffect, useState, useRef } from 'react';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const useAutoPublishAssignments = () => {
  const { assignments, loading, publishAssignmentsByDate } = useOptimizedAssignments('all');
  const { toast } = useToast();
  const { t } = useTranslation();
  const [lastPublishedDate, setLastPublishedDate] = useState<string | null>(null);
  const publishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const publishingRef = useRef(false);

  // Function to check if it's time to publish
  const checkAndPublish = async () => {
    if (publishingRef.current || loading || !assignments?.length) {
      return; // Skip if already publishing or assignments are still loading
    }
    
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDate = format(now, 'yyyy-MM-dd');
      
      // Check if it's 16:00 or later and we haven't published yet today
      if ((currentHour === 16 && currentMinute === 0) || 
          (currentHour > 16 && lastPublishedDate !== currentDate)) {
        
        // Mark as currently publishing to prevent duplicate calls
        publishingRef.current = true;
        
        // Find unpublished assignments for today
        const unpublishedAssignments = assignments?.filter(a => 
          a.date === currentDate && !a.published
        ) || [];
        
        if (unpublishedAssignments.length > 0) {
          // Publish all unpublished assignments for today
          await publishAssignmentsByDate(currentDate);
          
          // Record that we've published today
          setLastPublishedDate(currentDate);
          
          // Show success notification
          toast({
            title: t('planner.autoPublishSuccess'),
            description: t('planner.autoPublishSuccessMsg', { 
              count: unpublishedAssignments.length 
            }),
          });
        }
      }
    } catch (err) {
      console.error('Error in auto-publish:', err);
    } finally {
      publishingRef.current = false;
    }
  };

  // Set up timer to check every minute
  useEffect(() => {
    // Initial check in case the app starts up after 16:00
    checkAndPublish();
    
    // Set interval to check every minute
    publishTimeoutRef.current = setInterval(checkAndPublish, 60000);
    
    // Clean up the interval on unmount
    return () => {
      if (publishTimeoutRef.current) {
        clearInterval(publishTimeoutRef.current);
      }
    };
  }, [assignments, loading]);

  return {
    lastPublishedDate,
  };
};
