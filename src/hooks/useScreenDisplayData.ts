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
      const retryDelay = attemptNumber * 500; // Increasing delay: 0ms, 500ms, 1000ms
      
      console.log('[useScreenDisplayData] 🚀 FETCH START:', {
        date,
        isEmpty: !date,
        isNewWindow,
        attemptNumber,
        retryDelay,
        timestamp: new Date().toISOString()
      });
      
      // For new windows, add a small delay to ensure proper initialization
      if (isNewWindow && attemptNumber === 0) {
        console.log('[useScreenDisplayData] ⏳ NEW WINDOW - Adding initialization delay');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Add retry delay if this is a retry attempt
      if (retryDelay > 0) {
        console.log(`[useScreenDisplayData] ⏳ RETRY DELAY: ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      // Always clear cache for new windows or retries to ensure fresh data
      if (isNewWindow || attemptNumber > 0) {
        console.log('[useScreenDisplayData] 🔄 CLEARING CACHE for fresh data');
        OptimizedAssignmentService.clearCache();
      }
      
      let data;
      if (!date) {
        console.log('[useScreenDisplayData] 🚀 FETCHING ALL published assignments (no date filter)');
        data = await OptimizedAssignmentService.fetchAllPublishedAssignments();
      } else {
        console.log('[useScreenDisplayData] 🚀 FETCHING published assignments for date:', date);
        data = await OptimizedAssignmentService.fetchPublishedAssignmentsByDate(date);
      }
      
      console.log('[useScreenDisplayData] 📋 RAW DATA from OptimizedAssignmentService:', {
        date,
        isNewWindow,
        attemptNumber,
        count: data.length,
        sampleData: data[0] || null,
        allTitles: data.map(a => a.title),
        allDates: data.map(a => a.assignment_date)
      });
      
      // If we got no data in a new window, but this is the first attempt, try again
      if (isNewWindow && data.length === 0 && attemptNumber < maxRetries) {
        console.log('[useScreenDisplayData] ⚠️ NEW WINDOW got empty data, retrying...');
        setRetryCount(attemptNumber + 1);
        return await fetchData(attemptNumber + 1);
      }
      
      // Convert to Assignment format using shared converter
      const convertedAssignments = data.map(convertOptimizedAssignmentToAssignment);
      console.log('[useScreenDisplayData] ✅ FINAL CONVERTED assignments:', {
        date,
        isNewWindow,
        attemptNumber,
        count: convertedAssignments.length,
        assignments: convertedAssignments.map(a => ({ 
          id: a.id, 
          title: a.title, 
          date: a.date,
          employees: a.assignedEmployees?.map(e => e.name) || []
        }))
      });
      
      setAssignments(convertedAssignments);
      setRetryCount(0); // Reset retry count on success
      
    } catch (err) {
      console.error('[useScreenDisplayData] 💥 ERROR:', {
        date,
        isNewWindow: window.opener !== null,
        attemptNumber,
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error'
      });
      
      // Retry logic for new windows
      const isNewWindow = window.opener !== null;
      const maxRetries = 3;
      
      if (isNewWindow && attemptNumber < maxRetries) {
        console.log(`[useScreenDisplayData] 🔄 RETRYING (${attemptNumber + 1}/${maxRetries})`);
        setRetryCount(attemptNumber + 1);
        return await fetchData(attemptNumber + 1);
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Fetch data when date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    console.log('[useScreenDisplayData] 🔄 REFETCH triggered, clearing cache for date:', date);
    // Clear cache to ensure fresh data
    OptimizedAssignmentService.clearCache();
    await fetchData();
  }, [fetchData, date]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};