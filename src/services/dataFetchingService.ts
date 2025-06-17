
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/securityLogger';

interface DataFetchOptions {
  retries?: number;
  timeout?: number;
  enableCache?: boolean;
}

class DataFetchingService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  async fetchWithErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    options: DataFetchOptions = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    const { retries = 3, timeout = 10000 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[DataFetchingService] ${operationName} - Attempt ${attempt}/${retries}`);
        
        // Add timeout to the operation
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );
        
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ]) as { data: T | null; error: any };

        if (result.error) {
          throw result.error;
        }

        if (attempt > 1) {
          console.log(`[DataFetchingService] ${operationName} succeeded on retry ${attempt}`);
        }

        return { data: result.data, error: null };
        
      } catch (error) {
        console.warn(`[DataFetchingService] ${operationName} failed on attempt ${attempt}:`, error);
        
        if (attempt === retries) {
          // Log final failure
          await logSecurityEvent(
            'data_fetch_failure',
            `${operationName} failed after ${retries} attempts`,
            {
              operation: operationName,
              error: error instanceof Error ? error.message : String(error),
              attempts: retries
            },
            'error'
          );
          
          return { data: null, error };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    return { data: null, error: new Error('Max retries exceeded') };
  }

  async fetchAssignments(includeUnpublished: boolean = true) {
    const cacheKey = this.getCacheKey('assignments', 'all', { includeUnpublished });
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    return this.fetchWithErrorHandling(async () => {
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
          cars:car_id (
            id,
            name,
            car_number
          ),
          responsible_user:responsible_user_id (
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true });

      if (!includeUnpublished) {
        query = query.eq('published', true);
      }

      const result = await query;
      
      if (result.data) {
        this.setCache(cacheKey, result.data);
      }
      
      return result;
    }, 'fetchAssignments');
  }

  async fetchEmployees() {
    const cacheKey = this.getCacheKey('profiles', 'employees', {});
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    return this.fetchWithErrorHandling(async () => {
      const result = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (result.data) {
        this.setCache(cacheKey, result.data);
      }
      
      return result;
    }, 'fetchEmployees');
  }

  async fetchCars() {
    const cacheKey = this.getCacheKey('cars', 'all', {});
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    return this.fetchWithErrorHandling(async () => {
      const result = await supabase
        .from('cars')
        .select('*')
        .order('name', { ascending: true });
      
      if (result.data) {
        this.setCache(cacheKey, result.data);
      }
      
      return result;
    }, 'fetchCars');
  }

  async fetchVacations() {
    const cacheKey = this.getCacheKey('vacations', 'all', {});
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    return this.fetchWithErrorHandling(async () => {
      const result = await supabase
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
      
      if (result.data) {
        this.setCache(cacheKey, result.data);
      }
      
      return result;
    }, 'fetchVacations');
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

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

export const dataFetchingService = new DataFetchingService();
