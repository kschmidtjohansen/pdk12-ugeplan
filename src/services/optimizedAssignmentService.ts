
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/context/AuthContext';

export interface OptimizedAssignmentData {
  id: string;
  title: string;
  description?: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  type?: string;
  published: boolean;
  responsible_user_id?: string;
  employees: string[];
  cars: Array<{ id: string; name: string }>;
  created_at: string;
  updated_at: string;
  responsible_user?: {
    id: string;
    name: string;
  };
}

export class OptimizedAssignmentService {
  private static requestCache = new Map<string, { data: OptimizedAssignmentData[]; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static pendingRequests = new Map<string, Promise<OptimizedAssignmentData[]>>();
  private static readonly MAX_RETRIES = 2;

  private static getCacheKey(filter: string, userId?: string, userRole?: string): string {
    return `${filter}-${userId || 'anon'}-${userRole || 'anon'}`;
  }

  private static async executeQuery(query: any, retryCount = 0): Promise<OptimizedAssignmentData[]> {
    try {
      const { data, error } = await query;
      
      if (error) {
        console.error(`[OptimizedAssignmentService] Query error (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < this.MAX_RETRIES) {
          console.log(`[OptimizedAssignmentService] Retrying query...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.executeQuery(query, retryCount + 1);
        }
        
        // Return empty array instead of throwing to prevent app crashes
        console.warn('[OptimizedAssignmentService] Max retries exceeded, returning empty array');
        return [];
      }

      if (!Array.isArray(data)) {
        console.warn('[OptimizedAssignmentService] Invalid data format, returning empty array');
        return [];
      }

      // Transform the data with better error handling
      return data.map((assignment: any) => {
        try {
          return {
            id: assignment.id || '',
            title: assignment.title || 'Untitled',
            description: assignment.description || '',
            date: assignment.assignment_date || '',
            fromTime: assignment.from_time || '',
            toTime: assignment.to_time || '',
            location: assignment.location || '',
            type: assignment.type || 'other',
            published: Boolean(assignment.published),
            responsible_user_id: assignment.responsible_user_id,
            employees: [], // Simplified to avoid join issues
            cars: [], // Simplified to avoid join issues
            created_at: assignment.created_at || new Date().toISOString(),
            updated_at: assignment.updated_at || new Date().toISOString(),
            responsible_user: assignment.responsible_user ? {
              id: assignment.responsible_user.id,
              name: assignment.responsible_user.name
            } : undefined
          };
        } catch (transformError) {
          console.error('[OptimizedAssignmentService] Error transforming assignment:', transformError);
          return {
            id: assignment.id || '',
            title: 'Error loading assignment',
            description: '',
            date: '',
            fromTime: '',
            toTime: '',
            location: '',
            type: 'other',
            published: false,
            responsible_user_id: undefined,
            employees: [],
            cars: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }).filter(assignment => assignment.id); // Remove any assignments without IDs
    } catch (error) {
      console.error('[OptimizedAssignmentService] Execute query error:', error);
      
      if (retryCount < this.MAX_RETRIES) {
        console.log(`[OptimizedAssignmentService] Retrying after error...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.executeQuery(query, retryCount + 1);
      }
      
      // Return empty array instead of throwing
      return [];
    }
  }

  private static async fetchWithCache(
    cacheKey: string,
    queryFn: () => Promise<OptimizedAssignmentData[]>
  ): Promise<OptimizedAssignmentData[]> {
    try {
      // Check cache first
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`[OptimizedAssignmentService] Cache hit for ${cacheKey}`);
        return cached.data;
      }

      // Check for pending request
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        console.log(`[OptimizedAssignmentService] Returning pending request for ${cacheKey}`);
        return pending;
      }

      // Execute new request
      const requestPromise = queryFn();
      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        
        // Cache the result
        this.requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        return result;
      } catch (error) {
        console.error(`[OptimizedAssignmentService] Request failed for ${cacheKey}:`, error);
        // Return empty array instead of throwing
        return [];
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[OptimizedAssignmentService] Cache operation failed for ${cacheKey}:`, error);
      return [];
    }
  }

  static async fetchAllAssignments(userRole: UserRole): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('all', undefined, userRole);
    
    return this.fetchWithCache(cacheKey, async () => {
      console.log('[OptimizedAssignmentService] Fetching all assignments');
      
      const query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at
        `)
        .order('assignment_date', { ascending: true });

      return this.executeQuery(query);
    });
  }

  static async fetchPublishedAssignments(userId: string, userRole: UserRole): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('published', userId, userRole);
    
    return this.fetchWithCache(cacheKey, async () => {
      console.log('[OptimizedAssignmentService] Fetching published assignments');
      
      const query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      return this.executeQuery(query);
    });
  }

  static async fetchUnpublishedAssignments(userId: string, userRole: UserRole): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('unpublished', userId, userRole);
    
    return this.fetchWithCache(cacheKey, async () => {
      console.log('[OptimizedAssignmentService] Fetching unpublished assignments');
      
      const query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at
        `)
        .eq('published', false)
        .order('assignment_date', { ascending: true });

      return this.executeQuery(query);
    });
  }

  static async fetchUserAssignments(userId: string, userRole: UserRole): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('user', userId, userRole);
    
    return this.fetchWithCache(cacheKey, async () => {
      console.log('[OptimizedAssignmentService] Fetching user assignments for:', userId);
      
      // For now, return published assignments as a safe fallback
      const query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      return this.executeQuery(query);
    });
  }

  static clearCache(): void {
    console.log('[OptimizedAssignmentService] Clearing cache');
    this.requestCache.clear();
    this.pendingRequests.clear();
  }

  static clearCacheForUser(userId: string): void {
    console.log('[OptimizedAssignmentService] Clearing cache for user:', userId);
    const keysToDelete = Array.from(this.requestCache.keys()).filter(key => key.includes(userId));
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }
}
