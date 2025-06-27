
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';

type FilterType = 'all' | 'published' | 'unpublished' | 'user';

interface UseOptimizedAssignmentsResult {
  assignments: OptimizedAssignmentData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useOptimizedAssignments = (filter: FilterType = 'all'): UseOptimizedAssignmentsResult => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<OptimizedAssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user?.id) {
      console.log('[useOptimizedAssignments] No user ID available, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`[useOptimizedAssignments] Fetching assignments with filter: ${filter} for user: ${user.name} (${user.role})`);
      
      let result: OptimizedAssignmentData[];
      
      switch (filter) {
        case 'all':
          result = await OptimizedAssignmentService.fetchAllAssignments(user.role);
          break;
        case 'published':
          result = await OptimizedAssignmentService.fetchPublishedAssignments(user.id, user.role);
          break;
        case 'unpublished':
          result = await OptimizedAssignmentService.fetchUnpublishedAssignments(user.id, user.role);
          break;
        case 'user':
          result = await OptimizedAssignmentService.fetchUserAssignments(user.id, user.role);
          break;
        default:
          result = [];
      }

      console.log(`[useOptimizedAssignments] Successfully fetched ${result.length} assignments`);
      setAssignments(result);
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.name, filter]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};
