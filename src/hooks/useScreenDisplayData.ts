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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (!date) {
        console.log('[useScreenDisplayData] 🚀 FETCHING ALL published assignments (no date filter)');
        data = await OptimizedAssignmentService.fetchAllPublishedAssignments();
      } else {
        console.log('[useScreenDisplayData] 🚀 FETCHING published assignments for date:', date);
        data = await OptimizedAssignmentService.fetchPublishedAssignmentsByDate(date);
      }
      
      console.log('[useScreenDisplayData] 📋 RAW DATA from OptimizedAssignmentService:', {
        count: data.length,
        sampleData: data[0] || null,
        allTitles: data.map(a => a.title)
      });
      
      // Convert to Assignment format using shared converter
      const convertedAssignments = data.map(convertOptimizedAssignmentToAssignment);
      console.log('[useScreenDisplayData] ✅ FINAL CONVERTED assignments:', {
        count: convertedAssignments.length,
        assignments: convertedAssignments
      });
      
      setAssignments(convertedAssignments);
      
    } catch (err) {
      console.error('[useScreenDisplayData] 💥 ERROR:', err);
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
    // Clear cache to ensure fresh data
    OptimizedAssignmentService.clearCache();
    await fetchData();
  }, [fetchData]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};