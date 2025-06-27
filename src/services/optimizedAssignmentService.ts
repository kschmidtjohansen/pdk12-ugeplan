
import { supabase } from '@/integrations/supabase/client';
import { circuitBreakerService } from './circuitBreakerService';

export interface OptimizedAssignmentData {
  id: string;
  title: string;
  description: string | null;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  type: string;
  published: boolean;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
  employees: Array<{ id: string; name: string }>;
  cars: Array<{ id: string; name: string; car_number: string }>;
  responsible_user: { id: string; name: string } | null;
  // Computed fields for compatibility
  date: string;
  fromTime: string;
  toTime: string;
}

export class OptimizedAssignmentService {
  private static cache = new Map<string, { data: OptimizedAssignmentData[]; timestamp: number }>();
  private static readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  private static getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private static setCache(key: string, data: OptimizedAssignmentData[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private static getCache(key: string): OptimizedAssignmentData[] | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  static async fetchAllAssignments(userRole?: string): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('fetchAllAssignments', { userRole });
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('[OptimizedAssignmentService] Returning cached all assignments');
      return cached;
    }

    return circuitBreakerService.execute('fetchAllAssignments', async () => {
      console.log('[OptimizedAssignmentService] Fetching all assignments for role:', userRole);
      
      const { data, error } = await supabase
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
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
        throw new Error(`Failed to fetch assignments: ${error.message}`);
      }

      const result = this.transformAssignmentData(data || []);
      this.setCache(cacheKey, result);
      console.log('[OptimizedAssignmentService] Fetched', result.length, 'assignments');
      return result;
    });
  }

  static async fetchUserAssignments(userId: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    if (!userId) {
      throw new Error('User ID is required for fetching user assignments');
    }

    const cacheKey = this.getCacheKey('fetchUserAssignments', { userId, userRole });
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('[OptimizedAssignmentService] Returning cached user assignments');
      return cached;
    }

    return circuitBreakerService.execute(`fetchUserAssignments_${userId}`, async () => {
      console.log('[OptimizedAssignmentService] Fetching user assignments for:', userId, 'role:', userRole);
      
      // Get assignment IDs where user is assigned
      const { data: userAssignmentIds, error: idsError } = await supabase
        .from('assignments_employees')
        .select('assignment_id')
        .eq('user_id', userId);

      if (idsError) {
        console.error('[OptimizedAssignmentService] Error fetching user assignment IDs:', idsError);
        throw new Error(`Failed to fetch user assignment IDs: ${idsError.message}`);
      }

      const assignmentIds = userAssignmentIds?.map(ae => ae.assignment_id) || [];
      
      if (assignmentIds.length === 0) {
        console.log('[OptimizedAssignmentService] No assignments found for user');
        return [];
      }

      // Get full assignment data with ALL employees for those assignments
      const { data, error } = await supabase
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
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .in('id', assignmentIds)
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching user assignments:', error);
        throw new Error(`Failed to fetch user assignments: ${error.message}`);
      }

      const result = this.transformAssignmentData(data || []);
      this.setCache(cacheKey, result);
      console.log('[OptimizedAssignmentService] Fetched', result.length, 'user assignments');
      return result;
    });
  }

  static async fetchPublishedAssignments(userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('fetchPublishedAssignments', { userId, userRole });
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('[OptimizedAssignmentService] Returning cached published assignments');
      return cached;
    }

    return circuitBreakerService.execute('fetchPublishedAssignments', async () => {
      console.log('[OptimizedAssignmentService] Fetching published assignments');
      
      const { data, error } = await supabase
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
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching published assignments:', error);
        throw new Error(`Failed to fetch published assignments: ${error.message}`);
      }

      const result = this.transformAssignmentData(data || []);
      this.setCache(cacheKey, result);
      console.log('[OptimizedAssignmentService] Fetched', result.length, 'published assignments');
      return result;
    });
  }

  static async fetchUnpublishedAssignments(userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    const cacheKey = this.getCacheKey('fetchUnpublishedAssignments', { userId, userRole });
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('[OptimizedAssignmentService] Returning cached unpublished assignments');
      return cached;
    }

    return circuitBreakerService.execute('fetchUnpublishedAssignments', async () => {
      console.log('[OptimizedAssignmentService] Fetching unpublished assignments');
      
      const { data, error } = await supabase
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
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .eq('published', false)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching unpublished assignments:', error);
        throw new Error(`Failed to fetch unpublished assignments: ${error.message}`);
      }

      const result = this.transformAssignmentData(data || []);
      this.setCache(cacheKey, result);
      return result;
    });
  }

  private static transformAssignmentData(data: any[]): OptimizedAssignmentData[] {
    return data.map(assignment => {
      // Preserve ALL employee information
      const employees = assignment.assignments_employees?.map((ae: any) => ({
        id: ae.profiles?.id || '',
        name: ae.profiles?.name || 'Unknown'
      })) || [];

      console.log(`[OptimizedAssignmentService] Transformed assignment "${assignment.title}" with ${employees.length} employees:`, 
        employees.map(e => e.name));

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        assignment_date: assignment.assignment_date,
        from_time: assignment.from_time,
        to_time: assignment.to_time,
        location: assignment.location,
        type: assignment.type || 'other',
        published: assignment.published,
        responsible_user_id: assignment.responsible_user_id,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        employees: employees,
        cars: assignment.cars || [],
        responsible_user: assignment.responsible_user,
        // Computed fields for compatibility
        date: assignment.assignment_date,
        fromTime: assignment.from_time,
        toTime: assignment.to_time
      };
    });
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('[OptimizedAssignmentService] Cache cleared');
  }
}
