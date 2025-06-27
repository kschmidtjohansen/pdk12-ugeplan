
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

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

  // Simple retry helper function
  const withRetry = async (operation: () => Promise<any>, operationName: string, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`[${operationName}] Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };

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

      console.log('[useAssignmentData] Starting assignment fetch...');

      // Step 1: Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication session is invalid or expired. Please refresh the page.');
      }

      console.log('[useAssignmentData] Session validated, fetching assignments...');

      // Step 2: Fetch assignments with retry logic
      let query = supabase
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
          responsibleUser:profiles!assignments_responsible_user_id_fkey (id, name)
        `);

      // Apply user-based filter if specified
      if (filterCriteria.filter === 'user' && filterCriteria.userId) {
        query = query.or(`responsible_user_id.eq.${filterCriteria.userId}`);
      }

      // Conditionally include unpublished assignments
      if (!filterCriteria.includeUnpublished) {
        query = query.eq('published', true);
      }

      // Execute the query with retry
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

      // Step 3: Fetch employees for assignments separately
      const assignmentIds = data.map(a => String(a.id)).filter(Boolean);
      
      const employeesResult = await withRetry(
        async () => {
          const queryResult = await supabase
            .from('assignments_employees')
            .select('assignment_id, user_id')
            .in('assignment_id', assignmentIds);
          return queryResult;
        },
        'Assignment employees fetch'
      );

      const { data: employeesData, error: employeesError } = employeesResult;

      if (employeesError) {
        console.warn('[useAssignmentData] Error fetching employees:', employeesError);
        // Continue without employees data
      }

      // Fetch profiles for employee names
      let profilesData: any[] = [];
      if (employeesData && employeesData.length > 0) {
        const userIds = [...new Set(employeesData.map(ae => String(ae.user_id)).filter(Boolean))];
        
        const profilesResult = await withRetry(
          async () => {
            const queryResult = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', userIds);
            return queryResult;
          },
          'Profiles fetch'
        );

        if (profilesResult.data) {
          profilesData = profilesResult.data;
        }
      }

      // Step 4: Transform data with employee information
      const transformedAssignments = transformAssignments(data);

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

  const transformAssignments = useCallback((data: any[]) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(assignment => {
      // Handle employee arrays properly
      const employees = assignment.assignments_employees?.map((ae: any) => ae.profiles?.name).filter(Boolean) || [];
      const cars = assignment.cars?.map((car: any) => car.name).filter(Boolean) || [];
      
      console.log(`[useAssignmentDataPhase3] Transform assignment "${assignment.title}":`, {
        rawEmployees: assignment.assignments_employees,
        transformedEmployees: employees,
        employeeCount: employees.length
      });

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        date: assignment.assignment_date,
        fromTime: assignment.from_time,
        toTime: assignment.to_time,
        location: assignment.location,
        type: assignment.type,
        published: assignment.published,
        responsibleUserId: assignment.responsible_user_id || '',
        employees: employees,
        car: cars.length > 0 ? cars[0] : null,
        cars: cars,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        responsibleUser: assignment.responsible_user
      };
    });
  }, []);

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
