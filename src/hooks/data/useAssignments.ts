
import { useState, useEffect } from 'react';
import { AssignmentService } from '@/services/data/assignmentService';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

interface UseAssignmentsResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useAssignments = (): UseAssignmentsResult => {
  const { user, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssignments = async () => {
    if (!isAuthenticated || !user) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      let result: Assignment[];
      
      if (user.role === 'administrator' || user.role === 'skadeleder') {
        result = await AssignmentService.fetchAllPublishedAssignments();
      } else {
        result = await AssignmentService.fetchUserAssignments(user.id);
      }

      setAssignments(result);
    } catch (err) {
      console.error('[useAssignments] Error fetching assignments:', err);
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
