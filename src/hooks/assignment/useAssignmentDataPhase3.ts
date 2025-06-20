
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabaseOptimized, ensureValidSessionOptimized, withRetry } from '@/integrations/supabase/clientOptimized';

interface AssignmentDataHookOptions {
  filter?: 'all' | 'user';
  initialAssignments?: Assignment[];
  includeUnpublished?: boolean;
}

export const useAssignmentDataPhase3 = (options: AssignmentDataHookOptions = {}) => {
  const { filter = 'all', initialAssignments = [], includeUnpublished = false } = options;
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Request deduplication
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between fetches

  // Error handling states
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Memoize the filter criteria
  const filterCriteria = useMemo(() => ({
    filter,
    userId: user?.id,
    includeUnpublished
  }), [filter, user?.id, includeUnpublished]);

  // Enhanced fetchAssignments function with deduplication, error handling, and retry logic
  const fetchAssignments = useCallback(async () => {
    // Request deduplication
    const now = Date.now();
    if (fetchInProgress.current || (now - lastFetchTime.current) < MIN_FETCH_INTERVAL) {
      console.log('[useAssignmentData] Fetch already in progress or too soon, skipping');
      return;
    }

    fetchInProgress.current = true;
    lastFetchTime.current = now;

    try {
      setLoading(true);
      setError(null);

      console.log('[useAssignmentData] Starting optimized assignment fetch with enhanced error recovery...');

      // Step 1: Ensure we have a valid authenticated session with retry
      const sessionValid = await withRetry(
        () => ensureValidSessionOptimized(),
        'Session validation'
      );

      if (!sessionValid) {
        throw new Error('Authentication session is invalid or expired. Please refresh the page.');
      }

      console.log('[useAssignmentData] Session validated, fetching assignments...');

      // Step 2: Fetch assignments with retry logic
      let query = supabaseOptimized
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          car_id,
          car_ids,
          employees,
          published,
          responsible_user_id,
          responsibleUser:profiles!assignments_responsible_user_id_fkey (id, name)
        `);

      // Apply user-based filter if specified
      if (filterCriteria.filter === 'user' && filterCriteria.userId) {
        query = query.or(`employees.cs.{${user?.name}},responsible_user_id.eq.${filterCriteria.userId}`);
      }

      // Conditionally include unpublished assignments
      if (!filterCriteria.includeUnpublished) {
        query = query.eq('published', true);
      }

      // Execute the query with retry - FIXED: Add await here
      const result = await withRetry(
        async () => {
          const queryResult = await query.order('assignment_date', { ascending: true });
          return queryResult;
        },
        'Assignments fetch'
      );

      const { data, error } = result;

      if (error) {
        console.error('[useAssignmentData] Assignments query error:', error);
        throw new Error(`Failed to fetch assignments: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('[useAssignmentData] No assignments found');
        setAssignments([]);
        return;
      }

      console.log(`[useAssignmentData] Successfully fetched ${data.length} assignments`);

      // Step 3: Transform data if necessary (e.g., handle responsibleUser)
      const transformedAssignments: Assignment[] = data.map(assignment => {
        const { responsibleUser, ...rest } = assignment;
        return {
          ...rest,
          date: assignment.assignment_date, // Map assignment_date to date
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          car: assignment.car_id,
          cars: assignment.car_ids || [],
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name
          } : null
        };
      });

      setAssignments(transformedAssignments);
      setRetryCount(0); // Reset retry count on success

    } catch (err) {
      console.error('[useAssignmentData] Error in fetchAssignments:', err);

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // Show user-friendly error message
      if (errorMessage.includes('Authentication') || errorMessage.includes('session')) {
        toast({
          title: t('common.error') || 'Error',
          description: t('auth.sessionExpired') || 'Session expired - please refresh the page',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('row-level security')) {
        toast({
          title: t('planner.rlsErrorTitle') || 'Access Error',
          description: t('planner.rlsErrorDescription') || 'Access error loading assignments. Security policies have been updated.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error') || 'Error',
          description: t('planner.fetchError') || 'Error loading assignments',
          variant: 'destructive',
        });
      }

      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`[useAssignmentData] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

        setTimeout(() => {
          setRetryCount(prevCount => prevCount + 1);
          fetchAssignments(); // Recursive call to retry
        }, delay);
      } else {
        console.error('[useAssignmentData] Max retries reached, giving up');
        setAssignments([]); // Clear assignments after max retries
      }

    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [toast, t, filterCriteria, retryCount, user?.name]);

  // Load assignments on component mount and when filter criteria change
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, filterCriteria]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments
  };
};
