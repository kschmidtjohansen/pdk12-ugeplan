
import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

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
      
      console.log('[useEmployeeDataOptimized] ===== STARTING EMPLOYEE FETCH =====');
      
      // Step 1: Ensure we have a valid authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication session is invalid or expired. Please refresh the page.');
      }
      
      console.log('[useEmployeeDataOptimized] Session validated, fetching profiles...');
      
      // Step 2: Fetch profiles with comprehensive debugging
      const profilesResult = await withRetry(
        async () => {
          const queryResult = await supabase
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
            .order('name', { ascending: true });
          return queryResult;
        },
        'Profiles fetch'
      );
      
      const { data: profilesData, error: profilesError } = profilesResult;
      
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
      
      // Step 3: Fetch user roles with comprehensive debugging
      const userIds = profilesData.map(profile => profile.id);
      
      console.log('[useEmployeeDataOptimized] ===== USER ROLES FETCH =====');
      console.log('[useEmployeeDataOptimized] Fetching roles for user IDs:', userIds.slice(0, 5), '...and', userIds.length - 5, 'more');
      
      const rolesResult = await withRetry(
        async () => {
          const queryResult = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', userIds);
          return queryResult;
        },
        'User roles fetch'
      );
      
      const { data: rolesData, error: rolesError } = rolesResult;
      
      if (rolesError) {
        console.error('[useEmployeeDataOptimized] CRITICAL ERROR: Roles query failed:', rolesError);
        console.warn('[useEmployeeDataOptimized] Continuing with default roles (servicemedarbejder)');
      } else {
        console.log(`[useEmployeeDataOptimized] ===== ROLES FETCH SUCCESS =====`);
        console.log(`[useEmployeeDataOptimized] Successfully fetched ${rolesData?.length || 0} role assignments`);
        console.log('[useEmployeeDataOptimized] Sample roles data:', rolesData?.slice(0, 5));
      }
      
      // Step 4: Transform data with comprehensive debugging
      console.log('[useEmployeeDataOptimized] ===== DATA TRANSFORMATION =====');
      const transformedEmployees: Employee[] = profilesData.map((profile, index) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        
        const employee = {
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
        
        // Log first 10 transformations in detail
        if (index < 10) {
          console.log(`[useEmployeeDataOptimized] Employee ${index + 1}: ${profile.name}`, {
            profileId: profile.id,
            foundRole: !!userRole,
            roleValue: userRole?.role,
            finalRole: employee.role,
            isEligible: employee.role === 'administrator' || employee.role === 'skadeleder'
          });
        }
        
        return employee;
      });
      
      console.log(`[useEmployeeDataOptimized] ===== TRANSFORMATION COMPLETE =====`);
      console.log(`[useEmployeeDataOptimized] Transformed ${transformedEmployees.length} employees`);
      
      // Final analysis
      const roleDistribution = {
        administrator: transformedEmployees.filter(emp => emp.role === 'administrator').length,
        skadeleder: transformedEmployees.filter(emp => emp.role === 'skadeleder').length,
        servicemedarbejder: transformedEmployees.filter(emp => emp.role === 'servicemedarbejder').length
      };
      
      const eligibleUsers = transformedEmployees.filter(emp => 
        emp.role === 'administrator' || emp.role === 'skadeleder'
      );

      console.log(`[useEmployeeDataOptimized] ===== FINAL ANALYSIS =====`);
      console.log('[useEmployeeDataOptimized] Role distribution:', roleDistribution);
      console.log(`[useEmployeeDataOptimized] Eligible users for responsible selection: ${eligibleUsers.length}`);
      console.log('[useEmployeeDataOptimized] Eligible users:', eligibleUsers.map(u => ({ 
        name: u.name, 
        role: u.role, 
        id: u.id.substring(0, 8) + '...' 
      })));
      
      // Expected users verification
      const expectedEligibleUsers = [
        'Bjarke Højland', 'Kasper Johansen', 'Morten Stokholm', // administrators
        'Anders Axelsen', 'Betina Poulsen', 'Nick Berg Hansen', 'Sisse Rud Hansen' // skadeleders
      ];
      
      console.log('[useEmployeeDataOptimized] ===== EXPECTED USERS VERIFICATION =====');
      expectedEligibleUsers.forEach(name => {
        const profile = profilesData.find(p => p.name === name);
        const role = rolesData?.find(r => r.user_id === profile?.id);
        const finalEmployee = transformedEmployees.find(e => e.name === name);
        
        console.log(`[useEmployeeDataOptimized] Expected user: ${name}`, {
          hasProfile: !!profile,
          hasRoleInDB: !!role,
          dbRole: role?.role,
          finalRole: finalEmployee?.role,
          isEligible: finalEmployee?.role === 'administrator' || finalEmployee?.role === 'skadeleder'
        });
      });
      
      setEmployees(transformedEmployees);
      setError(null);
      resetCircuitBreaker();
      
      console.log('[useEmployeeDataOptimized] ===== FETCH COMPLETE SUCCESS =====');
      
    } catch (err) {
      console.error('[useEmployeeDataOptimized] ===== FETCH FAILED =====');
      console.error('[useEmployeeDataOptimized] Error:', err);
      
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
    console.log('[useEmployeeDataOptimized] Setting up realtime subscription...');
    
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
      const channel = supabase
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
                supabase.removeChannel(channel);
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
      supabase.removeChannel(channel);
    };
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
