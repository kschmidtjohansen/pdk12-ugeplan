import { useState, useEffect, useCallback } from 'react';
import { OptimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { Assignment } from '@/types/assignment';
import { convertOptimizedAssignmentToAssignment } from '@/utils/assignmentDataConverter';

interface UseScreenDisplayDataResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useScreenDisplayData = (date: string): UseScreenDisplayDataResult => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (attemptNumber = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const isNewWindow = window.opener !== null;
      const maxRetries = 3;
      const retryDelay = attemptNumber * 500;
      
      if (import.meta.env.DEV) console.log('[useScreenDisplayData] 🚀 FETCH START:', {
        date, isEmpty: !date, isNewWindow, attemptNumber, retryDelay
      });
      
      if (isNewWindow && attemptNumber === 0) {
        if (import.meta.env.DEV) console.log('[useScreenDisplayData] ⏳ NEW WINDOW - Adding initialization delay');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (retryDelay > 0) {
        if (import.meta.env.DEV) console.log(`[useScreenDisplayData] ⏳ RETRY DELAY: ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      if (isNewWindow || attemptNumber > 0) {
        if (import.meta.env.DEV) console.log('[useScreenDisplayData] 🔄 CLEARING CACHE for fresh data');
        OptimizedAssignmentService.clearCache();
      }
      
      let data;
      if (!date) {
        if (import.meta.env.DEV) console.log('[useScreenDisplayData] 🚀 FETCHING ALL published assignments (no date filter)');
        data = await OptimizedAssignmentService.fetchAllPublishedAssignments();
      } else {
        if (import.meta.env.DEV) console.log('[useScreenDisplayData] 🚀 FETCHING published assignments for date:', date);
        data = await OptimizedAssignmentService.fetchPublishedAssignmentsByDate(date);
      }
      
      if (import.meta.env.DEV) console.log('[useScreenDisplayData] 📋 RAW DATA:', {
        date, isNewWindow, attemptNumber, count: data.length
      });
      
      if (isNewWindow && data.length === 0 && attemptNumber < maxRetries) {
        if (import.meta.env.DEV) console.log('[useScreenDisplayData] ⚠️ NEW WINDOW got empty data, retrying...');
        setRetryCount(attemptNumber + 1);
        return await fetchData(attemptNumber + 1);
      }
      
      const convertedAssignments = data.map(convertOptimizedAssignmentToAssignment);
      if (import.meta.env.DEV) console.log('[useScreenDisplayData] ✅ FINAL CONVERTED assignments:', {
        date, count: convertedAssignments.length
      });
      
      setAssignments(convertedAssignments);
      setRetryCount(0);
      
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useScreenDisplayData] 💥 ERROR:', {
        date, attemptNumber, message: err instanceof Error ? err.message : 'Unknown error'
      });
      
      const isNewWindow = window.opener !== null;
      const maxRetries = 3;
      
      if (isNewWindow && attemptNumber < maxRetries) {
        if (import.meta.env.DEV) console.log(`[useScreenDisplayData] 🔄 RETRYING (${attemptNumber + 1}/${maxRetries})`);
        setRetryCount(attemptNumber + 1);
        return await fetchData(attemptNumber + 1);
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    if (import.meta.env.DEV) console.log('[useScreenDisplayData] 🔄 REFETCH triggered for date:', date);
    OptimizedAssignmentService.clearCache();
    await fetchData();
  }, [fetchData, date]);

  return { assignments, loading, error, refetch };
};
