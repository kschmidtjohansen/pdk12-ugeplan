
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

interface DataFetchResult<T> {
  data: T[];
  error: string | null;
  fromCache: boolean;
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  expiry: number;
}

class UnifiedDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private circuitBreakers = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 2;

  private getCircuitBreakerKey(operation: string): string {
    return `circuit_${operation}`;
  }

  private isCircuitOpen(operation: string): boolean {
    const key = this.getCircuitBreakerKey(operation);
    const breaker = this.circuitBreakers.get(key);
    
    if (!breaker) return false;
    
    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        // Reset circuit breaker
        this.circuitBreakers.delete(key);
        console.log(`[UnifiedDataService] Circuit breaker reset for ${operation}`);
        return false;
      }
      return true;
    }
    
    return false;
  }

  private recordFailure(operation: string): void {
    const key = this.getCircuitBreakerKey(operation);
    const breaker = this.circuitBreakers.get(key) || { failures: 0, lastFailure: 0, isOpen: false };
    
    breaker.failures += 1;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      breaker.isOpen = true;
      console.warn(`[UnifiedDataService] Circuit breaker opened for ${operation} after ${breaker.failures} failures`);
    }
    
    this.circuitBreakers.set(key, breaker);
  }

  private recordSuccess(operation: string): void {
    const key = this.getCircuitBreakerKey(operation);
    this.circuitBreakers.delete(key);
  }

  public resetCircuitBreaker(operation: string): void {
    const key = this.getCircuitBreakerKey(operation);
    this.circuitBreakers.delete(key);
    console.log(`[UnifiedDataService] Manual circuit breaker reset for ${operation}`);
  }

  public resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log(`[UnifiedDataService] All circuit breakers reset`);
  }

  private getCacheKey(operation: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${operation}_${paramString}`;
  }

  private getFromCache<T>(key: string): T[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('[UnifiedDataService] Cache cleared');
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`[UnifiedDataService] ${operationName} attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async fetchEmployees(): Promise<DataFetchResult<Employee>> {
    const operation = 'employees';
    const cacheKey = this.getCacheKey(operation);
    
    // Check circuit breaker
    if (this.isCircuitOpen(operation)) {
      console.log(`[UnifiedDataService] Circuit breaker open for ${operation}, using cache or empty data`);
      const cachedData = this.getFromCache<Employee>(cacheKey);
      return {
        data: cachedData || [],
        error: 'Service temporarily unavailable (circuit breaker open)',
        fromCache: cachedData !== null
      };
    }

    // Check cache first
    const cachedData = this.getFromCache<Employee>(cacheKey);
    if (cachedData) {
      console.log(`[UnifiedDataService] Returning cached ${operation} data`);
      return { data: cachedData, error: null, fromCache: true };
    }

    try {
      console.log(`[UnifiedDataService] Fetching fresh ${operation} data with fixed RLS policies`);
      
      const result = await this.withRetry(async () => {
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            phone,
            job_title,
            on_leave,
            notes,
            avatar_url
          `)
          .order('name', { ascending: true });

        if (profilesError) throw profilesError;
        if (!profilesData) throw new Error('No profiles data returned');

        // Fetch user roles - now works with fixed policies
        let rolesData: any[] = [];
        try {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', profilesData.map(p => p.id));
          
          if (rolesError) {
            console.warn(`[UnifiedDataService] Roles query failed:`, rolesError);
          } else {
            rolesData = roles || [];
            console.log(`[UnifiedDataService] Successfully fetched ${rolesData.length} role assignments`);
          }
        } catch (roleError) {
          console.warn(`[UnifiedDataService] Role fetching failed:`, roleError);
        }

        // Transform to Employee format
        const employees: Employee[] = profilesData.map(profile => {
          const userRole = rolesData.find(r => r.user_id === profile.id);
          
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

        return employees;
      }, operation);

      this.setCache(cacheKey, result);
      this.recordSuccess(operation);
      
      console.log(`[UnifiedDataService] Successfully fetched ${result.length} employees`);
      return { data: result, error: null, fromCache: false };

    } catch (error) {
      this.recordFailure(operation);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[UnifiedDataService] Failed to fetch ${operation}:`, error);
      
      return {
        data: [],
        error: errorMessage,
        fromCache: false
      };
    }
  }

  async fetchAssignments(includeUnpublished: boolean = false): Promise<DataFetchResult<Assignment>> {
    const operation = 'assignments';
    const cacheKey = this.getCacheKey(operation, { includeUnpublished });
    
    if (this.isCircuitOpen(operation)) {
      const cachedData = this.getFromCache<Assignment>(cacheKey);
      return {
        data: cachedData || [],
        error: 'Service temporarily unavailable (circuit breaker open)',
        fromCache: cachedData !== null
      };
    }

    const cachedData = this.getFromCache<Assignment>(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null, fromCache: true };
    }

    try {
      const result = await this.withRetry(async () => {
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
            created_at,
            updated_at,
            responsibleUser:profiles!assignments_responsible_user_id_fkey (id, name)
          `);

        if (!includeUnpublished) {
          query = query.eq('published', true);
        }

        const { data: assignmentsData, error: assignmentsError } = await query
          .order('assignment_date', { ascending: true });

        if (assignmentsError) throw assignmentsError;
        if (!assignmentsData) return [];

        // Fetch employee assignments
        const assignmentIds = assignmentsData.map(a => a.id);
        let employeesData: any[] = [];
        let profilesData: any[] = [];

        if (assignmentIds.length > 0) {
          try {
            const { data: empData } = await supabase
              .from('assignments_employees')
              .select('assignment_id, user_id')
              .in('assignment_id', assignmentIds);
            
            employeesData = empData || [];

            if (employeesData.length > 0) {
              const userIds = [...new Set(employeesData.map(ae => ae.user_id))];
              const { data: profData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds);
              
              profilesData = profData || [];
            }
          } catch (empError) {
            console.warn('[UnifiedDataService] Failed to fetch assignment employees:', empError);
          }
        }

        // Transform assignments
        const assignments: Assignment[] = assignmentsData.map(assignment => {
          const assignmentEmployees = employeesData.filter(ae => ae.assignment_id === assignment.id);
          const employees = assignmentEmployees
            .map(ae => {
              const profile = profilesData.find(p => p.id === ae.user_id);
              return profile?.name;
            })
            .filter(Boolean);

          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            date: assignment.assignment_date,
            fromTime: assignment.from_time,
            toTime: assignment.to_time,
            location: assignment.location,
            type: 'other' as const,
            published: assignment.published,
            responsibleUserId: assignment.responsible_user_id || '',
            employees: employees,
            car: assignment.car_id || '',
            cars: assignment.car_ids || [],
            createdAt: assignment.created_at,
            updatedAt: assignment.updated_at,
            responsibleUser: assignment.responsibleUser
          };
        });

        return assignments;
      }, operation);

      this.setCache(cacheKey, result);
      this.recordSuccess(operation);
      
      return { data: result, error: null, fromCache: false };

    } catch (error) {
      this.recordFailure(operation);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[UnifiedDataService] Failed to fetch ${operation}:`, error);
      
      return {
        data: [],
        error: errorMessage,
        fromCache: false
      };
    }
  }

  async fetchCars(): Promise<DataFetchResult<Car>> {
    const operation = 'cars';
    const cacheKey = this.getCacheKey(operation);
    
    if (this.isCircuitOpen(operation)) {
      const cachedData = this.getFromCache<Car>(cacheKey);
      return {
        data: cachedData || [],
        error: 'Service temporarily unavailable (circuit breaker open)',
        fromCache: cachedData !== null
      };
    }

    const cachedData = this.getFromCache<Car>(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null, fromCache: true };
    }

    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
      }, operation);

      this.setCache(cacheKey, result);
      this.recordSuccess(operation);
      
      return { data: result, error: null, fromCache: false };

    } catch (error) {
      this.recordFailure(operation);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[UnifiedDataService] Failed to fetch ${operation}:`, error);
      
      return {
        data: [],
        error: errorMessage,
        fromCache: false
      };
    }
  }

  async verifyDatabaseFix(): Promise<any> {
    try {
      console.log('[UnifiedDataService] Verifying database fix...');
      const { data, error } = await supabase.rpc('verify_policy_fix');
      
      if (error) throw error;
      
      console.log('[UnifiedDataService] Database fix verification:', data);
      return data;
    } catch (error) {
      console.error('[UnifiedDataService] Database fix verification failed:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async checkSystemHealth(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('check_data_access_health');
      
      if (error) throw error;
      
      console.log('[UnifiedDataService] System health check:', data);
      return data;
    } catch (error) {
      console.error('[UnifiedDataService] Health check failed:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getStatus() {
    return {
      cacheSize: this.cache.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([key, value]) => ({
        operation: key,
        ...value
      })),
      cacheEntries: Array.from(this.cache.keys())
    };
  }
}

export const unifiedDataService = new UnifiedDataService();
