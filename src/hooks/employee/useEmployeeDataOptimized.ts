
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
      
      console.log('🚀 [useEmployeeDataOptimized] ===== COMPREHENSIVE EMPLOYEE FETCH START =====');
      
      // Step 1: Ensure we have a valid authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication session is invalid or expired. Please refresh the page.');
      }
      
      console.log('✅ [useEmployeeDataOptimized] Session validated successfully');
      
      // Step 2: Fetch profiles with enhanced debugging
      console.log('📋 [useEmployeeDataOptimized] ===== FETCHING PROFILES =====');
      
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
        console.error('❌ [useEmployeeDataOptimized] Profiles query error:', profilesError);
        throw new Error(`Failed to fetch employee profiles: ${profilesError.message}`);
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('⚠️ [useEmployeeDataOptimized] No profiles found');
        setEmployees([]);
        resetCircuitBreaker();
        return;
      }
      
      console.log(`✅ [useEmployeeDataOptimized] Successfully fetched ${profilesData.length} profiles`);
      console.log('📋 [useEmployeeDataOptimized] Sample profiles:', profilesData.slice(0, 3).map(p => ({ id: p.id.substring(0, 8) + '...', name: p.name, email: p.email })));
      
      // Step 3: Fetch user roles with CRITICAL debugging
      const userIds = profilesData.map(profile => profile.id);
      
      console.log('🔐 [useEmployeeDataOptimized] ===== FETCHING USER ROLES =====');
      console.log(`🔐 [useEmployeeDataOptimized] Fetching roles for ${userIds.length} users`);
      console.log('🔐 [useEmployeeDataOptimized] Sample user IDs:', userIds.slice(0, 3).map(id => id.substring(0, 8) + '...'));
      
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
        console.error('❌ [useEmployeeDataOptimized] CRITICAL ERROR: Roles query failed:', rolesError);
        console.warn('⚠️ [useEmployeeDataOptimized] Continuing with default roles (servicemedarbejder)');
      } else {
        console.log(`✅ [useEmployeeDataOptimized] Successfully fetched ${rolesData?.length || 0} role assignments`);
        console.log('🔐 [useEmployeeDataOptimized] Sample roles data:', rolesData?.slice(0, 5).map(r => ({ 
          user_id: r.user_id.substring(0, 8) + '...', 
          role: r.role 
        })));
        
        // Detailed role analysis
        if (rolesData && rolesData.length > 0) {
          const roleDistribution = rolesData.reduce((acc, role) => {
            acc[role.role] = (acc[role.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log('📊 [useEmployeeDataOptimized] Role distribution in database:', roleDistribution);
          
          // Check for expected users
          const expectedAdmins = ['Bjarke Højland', 'Kasper Johansen', 'Morten Stokholm'];
          const expectedSkadeleders = ['Anders Axelsen', 'Betina Poulsen', 'Nick Berg Hansen', 'Sisse Rud Hansen'];
          
          console.log('🎯 [useEmployeeDataOptimized] ===== EXPECTED USERS VERIFICATION =====');
          [...expectedAdmins, ...expectedSkadeleders].forEach(expectedName => {
            const profile = profilesData.find(p => p.name === expectedName);
            const role = rolesData.find(r => r.user_id === profile?.id);
            
            console.log(`🎯 Expected user "${expectedName}":`, {
              hasProfile: !!profile,
              profileId: profile?.id?.substring(0, 8) + '...' || 'N/A',
              hasRoleInDB: !!role,
              dbRole: role?.role || 'NOT_FOUND',
              expectedRole: expectedAdmins.includes(expectedName) ? 'administrator' : 'skadeleder'
            });
          });
        }
      }
      
      // Step 4: Transform data with COMPREHENSIVE debugging
      console.log('🔄 [useEmployeeDataOptimized] ===== DATA TRANSFORMATION =====');
      const transformedEmployees: Employee[] = [];
      
      profilesData.forEach((profile, index) => {
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
        
        transformedEmployees.push(employee);
        
        // Log first 10 transformations in detail
        if (index < 10) {
          console.log(`🔄 Employee ${index + 1}: "${profile.name}"`, {
            profileId: profile.id.substring(0, 8) + '...',
            foundRole: !!userRole,
            roleValue: userRole?.role || 'DEFAULT',
            finalRole: employee.role,
            isEligible: employee.role === 'administrator' || employee.role === 'skadeleder'
          });
        }
      });
      
      console.log(`✅ [useEmployeeDataOptimized] Transformation complete: ${transformedEmployees.length} employees`);
      
      // Step 5: Final analysis and verification
      const finalRoleDistribution = {
        administrator: transformedEmployees.filter(emp => emp.role === 'administrator').length,
        skadeleder: transformedEmployees.filter(emp => emp.role === 'skadeleder').length,
        servicemedarbejder: transformedEmployees.filter(emp => emp.role === 'servicemedarbejder').length
      };
      
      const eligibleUsers = transformedEmployees.filter(emp => 
        emp.role === 'administrator' || emp.role === 'skadeleder'
      );

      console.log('📊 [useEmployeeDataOptimized] ===== FINAL ANALYSIS =====');
      console.log('📊 Final role distribution:', finalRoleDistribution);
      console.log(`🎯 Eligible users for responsible selection: ${eligibleUsers.length} out of ${transformedEmployees.length}`);
      console.log('🎯 Eligible users list:', eligibleUsers.map(u => ({ 
        name: u.name, 
        role: u.role, 
        id: u.id.substring(0, 8) + '...' 
      })));
      
      if (eligibleUsers.length < 7) {
        console.warn(`⚠️ [useEmployeeDataOptimized] WARNING: Expected 7 eligible users but found ${eligibleUsers.length}`);
        console.warn('⚠️ This suggests role data is not being fetched or transformed correctly');
      }
      
      setEmployees(transformedEmployees);
      setError(null);
      resetCircuitBreaker();
      
      console.log('🎉 [useEmployeeDataOptimized] ===== FETCH COMPLETE SUCCESS =====');
      console.log(`🎉 Final result: ${transformedEmployees.length} employees, ${eligibleUsers.length} eligible for responsible user selection`);
      
    } catch (err) {
      console.error('💥 [useEmployeeDataOptimized] ===== FETCH FAILED =====');
      console.error('💥 Error details:', err);
      
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
        .channel('profiles_changes_optimized_v3')
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
