
import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabaseOptimized, ensureValidSessionOptimized, withRetry, clearSessionCache } from '@/integrations/supabase/clientOptimized';

export const useEmployeeDataOptimized = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Circuit breaker pattern
  const [failureCount, setFailureCount] = useState(0);
  const [lastFailureTime, setLastFailureTime] = useState(0);
  const MAX_FAILURES = 3;
  const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  
  // Request deduplication
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between fetches

  const isCircuitOpen = useCallback(() => {
    if (failureCount >= MAX_FAILURES) {
      const timeSinceLastFailure = Date.now() - lastFailureTime;
      return timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT;
    }
    return false;
  }, [failureCount, lastFailureTime]);

  const resetCircuitBreaker = useCallback(() => {
    setFailureCount(0);
    setLastFailureTime(0);
  }, []);

  const recordFailure = useCallback(() => {
    setFailureCount(prev => prev + 1);
    setLastFailureTime(Date.now());
  }, []);

  const fetchEmployees = useCallback(async () => {
    // Circuit breaker check
    if (isCircuitOpen()) {
      console.log('[useEmployeeDataOptimized] Circuit breaker is open, skipping fetch');
      return;
    }

    // Request deduplication
    const now = Date.now();
    if (fetchInProgress.current || (now - lastFetchTime.current) < MIN_FETCH_INTERVAL) {
      console.log('[useEmployeeDataOptimized] Fetch already in progress or too soon, skipping');
      return;
    }

    fetchInProgress.current = true;
    lastFetchTime.current = now;

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmployeeDataOptimized] Starting optimized employee fetch with enhanced error recovery...');
      
      // Step 1: Ensure we have a valid authenticated session with retry
      const sessionValid = await withRetry(
        () => ensureValidSessionOptimized(),
        'Session validation'
      );
      
      if (!sessionValid) {
        clearSessionCache();
        throw new Error('Authentication session is invalid or expired. Please refresh the page.');
      }
      
      console.log('[useEmployeeDataOptimized] Session validated, fetching profiles...');
      
      // Step 2: Fetch profiles with retry logic
      const { data: profilesData, error: profilesError } = await withRetry(
        () => supabaseOptimized
          .from('profiles')
          .select(`
            id,
            name,
            email,
            phone,
            job_title,
            on_leave,
            notes,
            avatar_url,
            created_at,
            updated_at
          `)
          .order('name', { ascending: true }),
        'Profiles fetch'
      );
      
      if (profilesError) {
        console.error('[useEmployeeDataOptimized] Profiles query error:', profilesError);
        throw new Error(`Failed to fetch employee profiles: ${profilesError.message}`);
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('[useEmployeeDataOptimized] No profiles found');
        setEmployees([]);
        resetCircuitBreaker();
        return;
      }
      
      console.log(`[useEmployeeDataOptimized] Successfully fetched ${profilesData.length} profiles`);
      
      // Step 3: Fetch user roles with retry logic
      const userIds = profilesData.map(profile => profile.id);
      
      console.log('[useEmployeeDataOptimized] Fetching user roles...');
      
      const { data: rolesData, error: rolesError } = await withRetry(
        () => supabaseOptimized
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds),
        'User roles fetch'
      );
      
      if (rolesError) {
        console.error('[useEmployeeDataOptimized] Roles query error:', rolesError);
        // Continue with default roles instead of failing completely
        console.warn('[useEmployeeDataOptimized] Continuing with default roles due to error:', rolesError.message);
      }
      
      console.log(`[useEmployeeDataOptimized] Successfully fetched ${rolesData?.length || 0} role assignments`);
      
      // Step 4: Transform data to Employee format
      const transformedEmployees: Employee[] = profilesData.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: userRole?.role || 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        };
      });
      
      console.log(`[useEmployeeDataOptimized] Successfully transformed ${transformedEmployees.length} employees`);
      setEmployees(transformedEmployees);
      
      // Clear any previous errors and reset circuit breaker
      setError(null);
      resetCircuitBreaker();
      
    } catch (err) {
      console.error('[useEmployeeDataOptimized] Error in fetchEmployees:', err);
      
      recordFailure();
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
          title: t('employees.rlsErrorTitle') || 'Access Error',
          description: t('employees.rlsErrorDescription') || 'Access error loading employees. Security policies have been updated.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error') || 'Error',
          description: t('employees.fetchError') || 'Error loading employees',
          variant: 'destructive',
        });
      }
      
      setEmployees([]);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [toast, t, isCircuitOpen, resetCircuitBreaker, recordFailure]);

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Set up enhanced realtime subscription with better error handling
  useEffect(() => {
    console.log('[useEmployeeDataOptimized] Setting up enhanced realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useEmployeeDataOptimized] Realtime refresh triggered');
        fetchEmployees();
      }, 3000); // Increased debounce time to reduce API calls
    };
    
    const setupSubscription = () => {
      const channel = supabaseOptimized
        .channel('profiles_changes_optimized_v2')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('[useEmployeeDataOptimized] Received profile change:', payload.eventType);
            debouncedRefresh();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles'
          },
          (payload) => {
            console.log('[useEmployeeDataOptimized] Received user role change:', payload.eventType);
            debouncedRefresh();
          }
        )
        .subscribe((status, err) => {
          console.log('[useEmployeeDataOptimized] Realtime subscription status:', status);
          
          if (status === 'CHANNEL_ERROR' && err) {
            console.error('[useEmployeeDataOptimized] Realtime subscription error:', err);
            
            // Retry subscription with exponential backoff
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`[useEmployeeDataOptimized] Retrying subscription in ${retryDelay}ms (attempt ${retryCount})`);
              
              setTimeout(() => {
                supabaseOptimized.removeChannel(channel);
                setupSubscription();
              }, retryDelay);
            } else {
              console.error('[useEmployeeDataOptimized] Max subscription retries reached, giving up');
            }
          } else if (status === 'SUBSCRIBED') {
            retryCount = 0; // Reset retry count on successful subscription
          }
        });
      
      return channel;
    };
    
    const channel = setupSubscription();

    return () => {
      console.log('[useEmployeeDataOptimized] Cleaning up realtime subscription');
      clearTimeout(timeoutId);
      supabaseOptimized.removeChannel(channel);
    };
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
