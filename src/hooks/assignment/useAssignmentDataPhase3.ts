
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

      // Step 2: Fetch assignments with proper joins and aggregation
      let baseQuery = supabaseOptimized
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
          published,
          responsible_user_id,
          created_at,
          updated_at
        `);

      // Apply user-based filter if specified
      if (filterCriteria.filter === 'user' && filterCriteria.userId) {
        baseQuery = baseQuery.or(`responsible_user_id.eq.${filterCriteria.userId}`);
      }

      // Conditionally include unpublished assignments
      if (!filterCriteria.includeUnpublished) {
        baseQuery = baseQuery.eq('published', true);
      }

      // Execute the base assignments query with retry
      const assignmentsResult = await withRetry(async () => {
        return await baseQuery.order('assignment_date', { ascending: true });
      }, 'Assignments fetch');

      const { data: assignmentsData, error: assignmentsError } = assignmentsResult;

      if (assignmentsError) {
        console.error('[useAssignmentData] Assignments query error:', assignmentsError);
        throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
      }

      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('[useAssignmentData] No assignments found');
        setAssignments([]);
        return;
      }

      console.log(`[useAssignmentData] Successfully fetched ${assignmentsData.length} assignments`);

      // Step 3: Fetch employee assignments mapping separately
      const assignmentIds = assignmentsData.map(a => a.id);
      const employeeAssignmentsResult = await withRetry(async () => {
        return await supabaseOptimized
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);
      }, 'Employee assignments fetch');

      const { data: employeeAssignmentsData, error: employeeAssignmentsError } = employeeAssignmentsResult;

      if (employeeAssignmentsError) {
        console.error('[useAssignmentData] Employee assignments query error:', employeeAssignmentsError);
        // Continue without employee data rather than failing completely
      }

      // Step 4: Fetch employee profiles separately
      let employeeProfilesData = [];
      if (employeeAssignmentsData && employeeAssignmentsData.length > 0) {
        const employeeUserIds = [...new Set(employeeAssignmentsData.map(ea => ea.user_id))];
        
        const employeeProfilesResult = await withRetry(async () => {
          return await supabaseOptimized
            .from('profiles')
            .select('id, name')
            .in('id', employeeUserIds);
        }, 'Employee profiles fetch');

        const { data, error: employeeProfilesError } = employeeProfilesResult;
        if (employeeProfilesError) {
          console.error('[useAssignmentData] Employee profiles query error:', employeeProfilesError);
          // Continue without employee profile data
        } else {
          employeeProfilesData = data || [];
        }
      }

      // Step 5: Fetch responsible users
      const responsibleUserIds = assignmentsData
        .map(a => a.responsible_user_id)
        .filter(id => id !== null);

      let responsibleUsersData = [];
      if (responsibleUserIds.length > 0) {
        const responsibleUsersResult = await withRetry(async () => {
          return await supabaseOptimized
            .from('profiles')
            .select('id, name')
            .in('id', responsibleUserIds);
        }, 'Responsible users fetch');

        const { data, error: responsibleUsersError } = responsibleUsersResult;
        if (responsibleUsersError) {
          console.error('[useAssignmentData] Responsible users query error:', responsibleUsersError);
          // Continue without responsible user data
        } else {
          responsibleUsersData = data || [];
        }
      }

      // Step 6: Fetch car data
      const carIds = assignmentsData
        .map(a => a.car_id)
        .filter(id => id !== null);

      let carsData = [];
      if (carIds.length > 0) {
        const carsResult = await withRetry(async () => {
          return await supabaseOptimized
            .from('cars')
            .select('id, name')
            .in('id', carIds);
        }, 'Cars fetch');

        const { data, error: carsError } = carsResult;
        if (carsError) {
          console.error('[useAssignmentData] Cars query error:', carsError);
          // Continue without car data
        } else {
          carsData = data || [];
        }
      }

      // Step 7: Transform and aggregate data
      const transformedAssignments: Assignment[] = assignmentsData.map(assignment => {
        // Get employees for this assignment by joining the data in JavaScript
        const assignmentEmployeeIds = employeeAssignmentsData
          ?.filter(ae => ae.assignment_id === assignment.id)
          ?.map(ae => ae.user_id) || [];

        const assignmentEmployees = assignmentEmployeeIds
          .map(userId => {
            const profile = employeeProfilesData.find(ep => ep.id === userId);
            return profile?.name;
          })
          .filter(name => name) as string[];

        // Get responsible user
        const responsibleUser = responsibleUsersData.find(ru => ru.id === assignment.responsible_user_id);

        // Get car
        const car = carsData.find(c => c.id === assignment.car_id);

        return {
          id: assignment.id,
          title: assignment.title || '',
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location || '',
          car: car ? { id: car.id, name: car.name } : null,
          cars: assignment.car_ids || [],
          employees: assignmentEmployees,
          published: assignment.published || false,
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name
          } : null
        };
      });

      console.log(`[useAssignmentData] Successfully transformed ${transformedAssignments.length} assignments`);
      console.log('[useAssignmentData] Sample assignment with employees:', transformedAssignments[0]);

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
  }, [toast, t, filterCriteria, retryCount]);

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
