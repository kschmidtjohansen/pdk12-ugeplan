import { supabase } from '@/integrations/supabase/client';
import { enhancedErrorHandler } from './enhancedErrorHandler';
import { getSchemaClient, DemoSchemaClient } from '@/integrations/supabase/demoSchemaClient';

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

  async fetchVacationsEnhanced(currentUserEmail?: string) {
    const isDemoMode = DemoSchemaClient.isDemoMode(currentUserEmail);
    const cacheKey = this.getCacheKey('vacations', 'enhanced', { currentUserEmail, isDemoMode });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    const result = await this.fetchWithEnhancedErrorHandling(async () => {
      const client = getSchemaClient(isDemoMode);
      
      // Enhanced vacation query with better error handling
      const { data, error } = await client
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
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Enhanced error context for vacation queries
        throw Object.assign(error, {
          context: 'vacation_fetch',
          table: 'vacations',
          operation: 'select_with_order',
          schema: isDemoMode ? 'demo' : 'public'
        });
      }
      
      return { data, error: null };
    }, 'fetchVacationsEnhanced', {
      retries: 4, // More retries for critical vacation data
      timeout: 15000, // Longer timeout for complex queries
      skipRetryFor: ['auth', 'rls'] // Don't retry auth/permission errors
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
      const client = getSchemaClient(isDemoMode);
      
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
          schema: isDemoMode ? 'demo' : 'public'
        });
      }
      
      return { data, error: null };
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
      
      // Demo mode: manually fetch from demo schema tables
      if (isDemoMode) {
        const client = getSchemaClient(true);
        
        // Fetch assignments
        const { data: assignments, error: assignmentsError } = await client
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (assignmentsError) throw assignmentsError;
        if (!assignments || assignments.length === 0) {
          return { data: [], error: null };
        }
        
        // Fetch assignment-employee mappings
        const assignmentIds = assignments.map((a: any) => a.id);
        const { data: mapping, error: mappingError } = await client
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);
        
        if (mappingError) throw mappingError;
        
        // Fetch profiles for team members
        const userIds = [...new Set((mapping || []).map((m: any) => m.user_id))];
        const { data: profiles, error: profilesError } = await client
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;
        
        // Build team arrays per assignment
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const teamByAssignment = new Map<string, any[]>();
        
        (mapping || []).forEach((m: any) => {
          if (!teamByAssignment.has(m.assignment_id)) {
            teamByAssignment.set(m.assignment_id, []);
          }
          const profile = profileMap.get(m.user_id);
          if (profile) {
            teamByAssignment.get(m.assignment_id)!.push(profile);
          }
        });
        
        // Enrich assignments with team data
        const enriched = assignments.map((a: any) => ({
          ...a,
          team: teamByAssignment.get(a.id) || []
        }));
        
        console.log('[Enhanced Data Fetching] Demo assignments:', enriched.length);
        return { data: enriched, error: null };
      }
      
      // Production: use RPC
      const { data, error } = await supabase
        .rpc('list_accessible_assignments_with_team');
      
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
      const client = getSchemaClient(isDemoMode);
      
      const { data, error } = await client
        .from('profiles')
        .select('id, name, email, phone, job_title, on_leave, notes, avatar_url, status')
        .order('name', { ascending: true });

      if (error) {
        throw Object.assign(error, {
          context: 'employee_fetch',
          table: 'profiles',
          operation: 'select_employees',
          schema: isDemoMode ? 'demo' : 'public'
        });
      }
      
      return { data, error: null };
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
      const client = getSchemaClient(isDemoMode);
      
      const { data, error } = await client
        .from('cars')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw Object.assign(error, {
          context: 'car_fetch',
          table: 'cars',
          operation: 'select_all',
          schema: isDemoMode ? 'demo' : 'public'
        });
      }
      
      return { data, error: null };
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
      const client = getSchemaClient(isDemoMode);
      const { error } = await client.from('profiles').select('count').limit(1);
      const responseTime = Date.now() - startTime;
      return { connected: !error, responseTime, error };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { connected: false, responseTime, error };
    }
  }
}

export const enhancedDataFetching = new EnhancedDataFetching();