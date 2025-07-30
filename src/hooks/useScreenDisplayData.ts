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
      
      console.log('[useScreenDisplayData] 🚀 FETCH START:', {
        date,
        isEmpty: !date,
        timestamp: new Date().toISOString()
      });
      
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
        count: data.length,
        sampleData: data[0] || null,
        allTitles: data.map(a => a.title),
        allDates: data.map(a => a.date)
      });
      
      // Convert to Assignment format using shared converter
      const convertedAssignments = data.map(convertOptimizedAssignmentToAssignment);
      console.log('[useScreenDisplayData] ✅ FINAL CONVERTED assignments:', {
        date,
        count: convertedAssignments.length,
        assignments: convertedAssignments.map(a => ({ 
          id: a.id, 
          title: a.title, 
          date: a.date,
          employees: a.assignedEmployees?.map(e => e.name) || []
        }))
      });
      
      setAssignments(convertedAssignments);
      
    } catch (err) {
      console.error('[useScreenDisplayData] 💥 ERROR:', {
        date,
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error'
      });
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