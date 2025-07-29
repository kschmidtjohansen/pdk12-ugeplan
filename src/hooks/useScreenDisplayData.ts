import { useState, useEffect, useCallback } from 'react';
import { ScreenDisplayService, ScreenDisplayAssignment } from '@/services/screenDisplayService';

interface UseScreenDisplayDataResult {
  assignments: ScreenDisplayAssignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useScreenDisplayData = (date: string): UseScreenDisplayDataResult => {
  const [assignments, setAssignments] = useState<ScreenDisplayAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!date) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await ScreenDisplayService.fetchAssignmentsByDate(date);
      setAssignments(data);
      
    } catch (err) {
      console.error('[useScreenDisplayData] Error:', err);
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
    await fetchData();
  }, [fetchData]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};