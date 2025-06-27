
import { useState, useEffect } from 'react';
import { SimpleAssignmentService } from '@/services/simpleAssignmentService';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

interface UseSimpleAssignmentsResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useSimpleAssignments = (): UseSimpleAssignmentsResult => {
  const { user, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssignments = async () => {
    if (!isAuthenticated || !user) {
      console.log('[useSimpleAssignments] User not authenticated, clearing assignments');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`[useSimpleAssignments] Fetching assignments for user: ${user.name} (${user.role})`);
      
      let result: Assignment[];
      
      if (user.role === 'administrator' || user.role === 'skadeleder') {
        // Admins and skadeledere see all published assignments
        result = await SimpleAssignmentService.fetchAllPublishedAssignments();
      } else {
        // Regular users see their own assignments
        result = await SimpleAssignmentService.fetchUserAssignments(user.id);
      }

      console.log(`[useSimpleAssignments] Successfully fetched ${result.length} assignments`);
      setAssignments(result);
    } catch (err) {
      console.error('[useSimpleAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchAssignments();
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.id, user?.role, isAuthenticated]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};
