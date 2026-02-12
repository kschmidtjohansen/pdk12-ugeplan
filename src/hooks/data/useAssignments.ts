
import { useState, useEffect, useCallback } from 'react';
import { AssignmentService } from '@/services/data/assignmentService';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
        result = await AssignmentService.fetchAllPublishedAssignments(user.email);
      } else {
        result = await AssignmentService.fetchUserAssignments(user.id, user.email);
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

  // Realtime subscription for assignments table
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const channel = supabase
      .channel('data-assignments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        if (!isMounted) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (isMounted) {
            console.log('[useAssignments] Realtime change detected, refetching...');
            refetch().catch(err => console.error('[useAssignments] Realtime refetch error:', err));
          }
        }, 1000);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useAssignments] Realtime channel error, falling back to existing data');
        }
      });

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, refetch]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};
