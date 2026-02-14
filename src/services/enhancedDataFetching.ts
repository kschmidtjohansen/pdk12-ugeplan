import { supabase } from '@/integrations/supabase/client';
import { enhancedErrorHandler } from './enhancedErrorHandler';
import { getSchemaClient, DemoSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';

interface DataFetchOptions {
  retries?: number;
  timeout?: number;
  enableCache?: boolean;
  skipRetryFor?: string[];
}

interface FetchResult<T> {
  data: T | null;
  error: any;
  fromCache?: boolean;
  retryCount?: number;
  timing?: number;
}

export class EnhancedDataFetching {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private circuitBreaker = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  private getCacheKey(table: string, query: string, params?: any): string {
    return `${table}_${query}_${JSON.stringify(params || {})}`;
  }

  private isValidCache(cacheEntry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && this.isValidCache(entry)) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private isCircuitOpen(operationName: string): boolean {
    const circuit = this.circuitBreaker.get(operationName);
    if (!circuit) return false;
    
    if (circuit.isOpen) {
      // Check if circuit should be closed (timeout passed)
      if (Date.now() - circuit.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        circuit.isOpen = false;
        circuit.failures = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  private recordFailure(operationName: string) {
    const circuit = this.circuitBreaker.get(operationName) || { failures: 0, lastFailure: 0, isOpen: false };
    circuit.failures++;
    circuit.lastFailure = Date.now();
    
    if (circuit.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      circuit.isOpen = true;
      console.warn(`[EnhancedDataFetching] Circuit breaker opened for ${operationName}`);
    }
    
    this.circuitBreaker.set(operationName, circuit);
  }

  private recordSuccess(operationName: string) {
    const circuit = this.circuitBreaker.get(operationName);
    if (circuit) {
      circuit.failures = 0;
      circuit.isOpen = false;
      this.circuitBreaker.set(operationName, circuit);
    }
  }

  async fetchWithEnhancedErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    options: DataFetchOptions = {}
  ): Promise<FetchResult<T>> {
    const startTime = Date.now();
    const { retries = 3, timeout = 10000, skipRetryFor = [] } = options;
    
    // Check circuit breaker
    if (this.isCircuitOpen(operationName)) {
      const error = new Error(`Circuit breaker is open for ${operationName}`);
      await enhancedErrorHandler.logError(error, {
        operation: operationName,
        retryCount: 0,
        timing: Date.now() - startTime
      });
      return { data: null, error, retryCount: 0, timing: Date.now() - startTime };
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[EnhancedDataFetching] ${operationName} - Attempt ${attempt}/${retries}`);
        
        // Add timeout to the operation
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
        );
        
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ]) as { data: T | null; error: any };

        if (result.error) {
          throw result.error;
        }

        // Record success for circuit breaker
        this.recordSuccess(operationName);

        if (attempt > 1) {
          console.log(`[EnhancedDataFetching] ${operationName} succeeded on retry ${attempt}`);
        }

        return { 
          data: result.data, 
          error: null, 
          retryCount: attempt - 1, 
          timing: Date.now() - startTime 
        };
        
      } catch (error) {
        console.warn(`[EnhancedDataFetching] ${operationName} failed on attempt ${attempt}:`, error);
        
        const serializedError = enhancedErrorHandler.serializeError(error);
        const category = enhancedErrorHandler.categorizeError(serializedError);
        
        // Log error with enhanced context
        await enhancedErrorHandler.logError(error, {
          operation: operationName,
          retryCount: attempt - 1,
          timing: Date.now() - startTime,
          additionalData: { category, attempt, maxRetries: retries }
        });
        
        if (attempt === retries) {
          // Record failure for circuit breaker
          this.recordFailure(operationName);
          
          return { 
            data: null, 
            error, 
            retryCount: attempt - 1, 
            timing: Date.now() - startTime 
          };
        }
        
        // Check if we should retry this error
        if (!enhancedErrorHandler.shouldRetry(serializedError, category, attempt - 1, retries) ||
            skipRetryFor.includes(category)) {
          console.log(`[EnhancedDataFetching] Skipping retry for ${operationName} due to error category: ${category}`);
          this.recordFailure(operationName);
          return { 
            data: null, 
            error, 
            retryCount: attempt - 1, 
            timing: Date.now() - startTime 
          };
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { 
      data: null, 
      error: new Error('Max retries exceeded'), 
      retryCount: retries, 
      timing: Date.now() - startTime 
    };
  }

  async fetchVacationsEnhanced(currentUserEmail?: string, departmentId?: string | null, subDepartmentId?: string | null) {
    const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
    const cacheKey = this.getCacheKey('vacations', 'enhanced', { currentUserEmail, isDemoMode, departmentId, subDepartmentId });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    const result = await this.fetchWithEnhancedErrorHandling(async () => {
      if (isDemoMode) {
        // Use demo RPC for demo users
        const { data, error } = await rpcWithRefresh('get_demo_vacations');
        
        if (error) {
          throw Object.assign(error, {
            context: 'demo_vacation_fetch',
            operation: 'demo_rpc_call'
          });
        }
        
        return { data, error: null };
      } else {
        // Production: Use direct table access
        const client = getSchemaClient(false);
        
        // Enhanced vacation query with department filtering
        let query = client
          .from('vacations')
          .select(`
            id,
            user_id,
            start_date,
            end_date,
            request_type,
            start_time,
            end_time,
            is_same_day,
            status,
            reason,
            notes,
            created_at,
            updated_at,
            department_id,
            sub_department_id
          `)
          .order('created_at', { ascending: false });
        
        // Filter by department if provided
        if (departmentId) {
          query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
        }
        
        // Filter by sub-department if provided (for skadeledere)
        if (subDepartmentId) {
          query = query.or(`sub_department_id.eq.${subDepartmentId},sub_department_id.is.null`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw Object.assign(error, {
            context: 'vacation_fetch',
            table: 'vacations',
            operation: 'select_with_order',
            schema: 'public'
          });
        }
        
        return { data, error: null };
      }
    }, 'fetchVacationsEnhanced', {
      retries: 4,
      timeout: 15000,
      skipRetryFor: ['auth', 'rls']
    });
    
    if (result.data) {
      this.setCache(cacheKey, result.data);
    }
    
    return result;
  }

  async fetchUserProfilesEnhanced(userIds: string[], currentUserEmail?: string) {
    if (!userIds.length) {
      return { data: [], error: null };
    }

    const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
    const cacheKey = this.getCacheKey('profiles', 'batch', { userIds: userIds.sort(), isDemoMode });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    const result = await this.fetchWithEnhancedErrorHandling(async () => {
      if (isDemoMode) {
        // Use demo RPC for demo users - get all profiles then filter
        const { data, error } = await rpcWithRefresh('get_demo_profiles_admin_detailed', {
          full_access: false
        });

        if (error) {
          throw Object.assign(error, {
            context: 'demo_profile_batch_fetch',
            operation: 'demo_rpc_call',
            userIds: userIds.length
          });
        }

        // Filter to requested user IDs and transform to match expected shape
        const filtered = (data || [])
          .filter((profile: any) => userIds.includes(profile.id))
          .map((profile: any) => ({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            status: profile.status
          }));
        
        return { data: filtered, error: null };
      } else {
        // Production: Use direct table access
        const client = getSchemaClient(false);
        
        const { data, error } = await client
          .from('profiles')
          .select('id, name, email, status')
          .in('id', userIds);

        if (error) {
          throw Object.assign(error, {
            context: 'profile_batch_fetch',
            table: 'profiles',
            userIds: userIds.length,
            operation: 'select_in',
            schema: 'public'
          });
        }
        
        return { data, error: null };
      }
    }, 'fetchUserProfilesEnhanced', {
      retries: 3,
      timeout: 10000,
      skipRetryFor: ['auth', 'rls']
    });
    
    if (result.data) {
      this.setCache(cacheKey, result.data, 10 * 60 * 1000); // Cache profiles longer
    }
    
    return result;
  }

  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    for (const [operation, circuit] of this.circuitBreaker.entries()) {
      status[operation] = {
        failures: circuit.failures,
        isOpen: circuit.isOpen,
        lastFailure: circuit.lastFailure ? new Date(circuit.lastFailure).toISOString() : null
      };
    }
    return status;
  }

  async fetchAssignmentsEnhanced(currentUserEmail?: string) {
    const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
    const cacheKey = this.getCacheKey('assignments', 'enhanced', { currentUserEmail, isDemoMode });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    const result = await this.fetchWithEnhancedErrorHandling(async () => {
      console.log('[Enhanced Data Fetching] Starting assignments fetch...', isDemoMode ? 'DEMO MODE' : 'PRODUCTION');
      
      if (isDemoMode) {
        // Use demo RPC for demo users
        const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
        
        if (error) {
          console.error('[Enhanced Data Fetching] Demo assignments fetch error:', error);
          throw Object.assign(error, {
            context: 'demo_assignment_fetch',
            operation: 'demo_rpc_call'
          });
        }

        console.log('[Enhanced Data Fetching] Demo assignments:', data?.length || 0);
        
        // Transform demo data to match production shape for dashboard metrics
        const transformedData = (data || []).map((assignment: any) => {
          const cars = Array.isArray(assignment.assignment_cars) ? assignment.assignment_cars : [];
          const carIds = cars.map((c: any) => c.id);
          const team = Array.isArray(assignment.team) ? assignment.team.map((m: any) => ({ 
            id: m.id, 
            name: m.name, 
            email: m.email 
          })) : [];
          
          return {
            ...assignment,
            // Keep BOTH date and assignment_date for compatibility with dashboard metrics
            date: assignment.date || assignment.assignment_date,
            assignment_date: assignment.date || assignment.assignment_date,
            from_time: assignment.from_time || '08:00:00',
            to_time: assignment.to_time || '16:00:00',
            car_ids: carIds,
            car_id: carIds[0] || null,
            team
          };
        });
        
        return { data: transformedData, error: null };
      }
      
      // Production: use RPC
      const { data, error } = await supabase
        .rpc('list_accessible_assignments_with_team', { p_department_id: null });
      
      if (error) {
        console.error('[Enhanced Data Fetching] Assignments fetch error:', error);
        throw Object.assign(error, {
          context: 'assignment_fetch',
          table: 'assignments',
          operation: 'secure_function_call'
        });
      }

      console.log('[Enhanced Data Fetching] Raw assignments data:', data?.length || 0);
      
      return { data, error: null };
    }, 'fetchAssignmentsEnhanced', {
      retries: 4,
      timeout: 15000,
      skipRetryFor: ['auth', 'rls']
    });
    
    if (result.data) {
      this.setCache(cacheKey, result.data, 5000);
    }
    
    return result;
  }

  async fetchEmployeesEnhanced(currentUserEmail?: string) {
    const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
    const cacheKey = this.getCacheKey('employees', 'enhanced', { currentUserEmail, isDemoMode });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    const result = await this.fetchWithEnhancedErrorHandling(async () => {
      if (isDemoMode) {
        // Use demo RPC for demo users
        const { data, error } = await rpcWithRefresh('get_demo_profiles_admin_detailed', {
          full_access: false
        });

        if (error) {
          throw Object.assign(error, {
            context: 'demo_employee_fetch',
            operation: 'demo_rpc_call'
          });
        }

        return { data, error: null };
      } else {
        // Production: Use direct table access with role join
        const client = getSchemaClient(false);
        
        const { data, error } = await client
          .from('profiles')
          .select(`
            id, name, email, phone, job_title, on_leave, notes, avatar_url, status,
            user_roles!inner(role)
          `)
          .order('name', { ascending: true });

        if (error) {
          throw Object.assign(error, {
            context: 'employee_fetch',
            table: 'profiles',
            operation: 'select_employees',
            schema: 'public'
          });
        }
        
        return { data, error: null };
      }
    }, 'fetchEmployeesEnhanced', {
      retries: 3,
      timeout: 10000,
      skipRetryFor: ['auth', 'rls']
    });
    
    if (result.data) {
      this.setCache(cacheKey, result.data, 10 * 60 * 1000); // Cache employees longer
    }
    
    return result;
  }

  async fetchCarsEnhanced(currentUserEmail?: string) {
    const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
    const cacheKey = this.getCacheKey('cars', 'enhanced', { isDemoMode });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    const result = await this.fetchWithEnhancedErrorHandling(async () => {
      if (isDemoMode) {
        // Use demo RPC for secure data access
        const { data, error } = await rpcWithRefresh('get_demo_cars_with_security');

        if (error) {
          throw Object.assign(error, {
            context: 'demo_car_fetch',
            operation: 'demo_rpc_call'
          });
        }

        // Filter out cars hidden from planner to match UI expectations
        const filteredDemoCars = (data || []).filter((c: any) => c.show_in_planner !== false);
        return { data: filteredDemoCars, error: null };
      } else {
        // Production: Use direct table access
        const client = getSchemaClient(false);
        
        const { data, error } = await client
          .from('cars')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw Object.assign(error, {
            context: 'car_fetch',
            table: 'cars',
            operation: 'select_all',
            schema: 'public'
          });
        }
        
        return { data, error: null };
      }
    }, 'fetchCarsEnhanced', {
      retries: 3,
      timeout: 8000,
      skipRetryFor: ['auth', 'rls']
    });
    
    if (result.data) {
      this.setCache(cacheKey, result.data, 15 * 60 * 1000); // Cache cars longer since they change less
    }
    
    return result;
  }

  async checkDatabaseConnectionEnhanced(currentUserEmail?: string): Promise<{ connected: boolean; responseTime?: number; error?: any }> {
    const startTime = Date.now();
    try {
      const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
      
      if (isDemoMode) {
        // Demo mode: Use demo RPC
        const { error } = await rpcWithRefresh('get_demo_profiles_admin_detailed', { full_access: false });
        const responseTime = Date.now() - startTime;
        return { connected: !error, responseTime, error };
      } else {
        // Production: Use direct table access
        const client = getSchemaClient(false);
        const { error } = await client.from('profiles').select('count').limit(1);
        const responseTime = Date.now() - startTime;
        return { connected: !error, responseTime, error };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { connected: false, responseTime, error };
    }
  }
}

export const enhancedDataFetching = new EnhancedDataFetching();