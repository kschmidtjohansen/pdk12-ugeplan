
import { useEffect, useState, useRef, useCallback } from 'react';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const useAutoPublishAssignments = () => {
  const { assignments, loading, publishAssignmentsByDate } = useOptimizedAssignments('unpublished');
  const { toast } = useToast();
  const { t } = useTranslation();
  const [lastPublishedDate, setLastPublishedDate] = useState<string | null>(null);
  const publishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const publishingRef = useRef(false);

  // Use refs for assignments/loading so the interval doesn't restart on every change
  const assignmentsRef = useRef(assignments);
  const loadingRef = useRef(loading);
  assignmentsRef.current = assignments;
  loadingRef.current = loading;

  const checkAndPublish = useCallback(async () => {
    if (publishingRef.current || loadingRef.current || !assignmentsRef.current?.length) {
      return;
    }
    
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDate = format(now, 'yyyy-MM-dd');
      const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
      
      // Auto-publish at midnight (00:00) — publish yesterday's unpublished assignments
      if ((currentHour === 0 && currentMinute === 0) || 
          (currentHour === 0 && lastPublishedDate !== currentDate)) {
        
        publishingRef.current = true;
        
        const unpublishedAssignments = assignmentsRef.current?.filter(a => 
          a.date === yesterday && !a.published
        ) || [];
        
        if (unpublishedAssignments.length > 0) {
          await publishAssignmentsByDate(yesterday);
          
          setLastPublishedDate(currentDate);
          
          toast({
            title: t('planner.autoPublishSuccess'),
            description: t('planner.autoPublishSuccessMsg', { 
              count: unpublishedAssignments.length 
            }),
          });
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error in auto-publish:', err);
    } finally {
      publishingRef.current = false;
    }
  }, [lastPublishedDate, publishAssignmentsByDate, toast, t]);

  // Set up timer to check every minute — stable interval that doesn't restart on data changes
  useEffect(() => {
    // Initial check in case the app starts up after midnight (00:00)
    checkAndPublish();
    
    publishTimeoutRef.current = setInterval(checkAndPublish, 60000);
    
    return () => {
      if (publishTimeoutRef.current) {
        clearInterval(publishTimeoutRef.current);
      }
    };
  }, [checkAndPublish]);

  return {
    lastPublishedDate,
  };
};
