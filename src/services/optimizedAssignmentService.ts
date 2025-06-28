import { supabase } from '@/lib/supabase';
import { Assignment } from '@/types/assignment';

export interface OptimizedAssignmentData {
  id: string;
  title: string;
  description: string | null;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  type: string | null;
  published: boolean;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
  responsible_user: {
    id: string;
    name: string;
  } | null;
  assignment_employees: {
    user_id: string;
    profiles: {
      id: string;
      name: string;
    }
  }[];
  assignment_cars: {
    id: string;
    name: string;
  }[];
}

const cache = new Map<string, OptimizedAssignmentData[]>();

const getCacheKey = (userId: string, role: string, filter: string): string => {
  return `${userId}-${role}-${filter}`;
};

const isCacheValid = (cacheKey: string, duration: number = 60000): boolean => {
  const cachedData = cache.get(cacheKey);
  if (!cachedData) return false;

  const { timestamp } = (cachedData as any).metadata || {};
  if (!timestamp) return false;

  return (Date.now() - timestamp) < duration;
};

const setCache = (cacheKey: string, data: OptimizedAssignmentData[]): void => {
  cache.set(cacheKey, {
    data,
    metadata: { timestamp: Date.now() }
  } as any);
};

const getFromCache = (cacheKey: string): OptimizedAssignmentData[] | undefined => {
  const cachedData = cache.get(cacheKey);
  if (cachedData && isCacheValid(cacheKey)) {
    console.log(`[OptimizedAssignmentService] Returning data from cache for key: ${cacheKey}`);
    return (cachedData as any).data;
  }
  return undefined;
};

export class OptimizedAssignmentService {
  static clearCache(): void {
    cache.clear();
    console.log('[OptimizedAssignmentService] Cache cleared');
  }

  private static transformAssignmentData(item: any): OptimizedAssignmentData {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      assignment_date: item.assignment_date,
      from_time: item.from_time,
      to_time: item.to_time,
      location: item.location,
      type: item.type,
      published: item.published,
      responsible_user_id: item.responsible_user_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      responsible_user: item.responsible_user,
      assignment_employees: item.assignment_employees,
      assignment_cars: item.assignment_cars
    };
  }

  static async fetchAllAssignments(role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching all assignments for role: ${role}`);

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
          updated_at,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          ),
          assignment_employees:assignments_employees(
            user_id,
            profiles(
              id,
              name
            )
          ),
          assignment_cars:cars!assignments_car_ids_fkey(
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} assignments`);

      const transformedData = data.map(this.transformAssignmentData);
      console.log('[OptimizedAssignmentService] Sample transformed data:', transformedData[0]);

      return transformedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
      throw error;
    }
  }

  // CRITICAL FIX: Add method to fetch ALL published assignments (not user-specific)
  static async fetchAllPublishedAssignments(): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Fetching ALL published assignments');
      
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
          updated_at,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          ),
          assignment_employees:assignments_employees(
            user_id,
            profiles(
              id,
              name
            )
          ),
          assignment_cars:cars!assignments_car_ids_fkey(
            id,
            name
          )
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No published assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} published assignments`);
      
      const transformedData = data.map(this.transformAssignmentData);
      console.log('[OptimizedAssignmentService] Sample transformed data:', transformedData[0]);
      
      return transformedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all published assignments:', error);
      throw error;
    }
  }

  static async fetchPublishedAssignments(userId: string, role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching published assignments for user ${userId} with role ${role}`);

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
          updated_at,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          ),
          assignment_employees:assignments_employees(
            user_id,
            profiles(
              id,
              name
            )
          ),
          assignment_cars:cars!assignments_car_ids_fkey(
            id,
            name
          )
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No published assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} published assignments`);

      const transformedData = data.map(this.transformAssignmentData);
      console.log('[OptimizedAssignmentService] Sample transformed data:', transformedData[0]);

      return transformedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching published assignments:', error);
      throw error;
    }
  }

  static async fetchUnpublishedAssignments(userId: string, role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching unpublished assignments for user ${userId} with role ${role}`);

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
          updated_at,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          ),
          assignment_employees:assignments_employees(
            user_id,
            profiles(
              id,
              name
            )
          ),
          assignment_cars:cars!assignments_car_ids_fkey(
            id,
            name
          )
        `)
        .eq('published', false)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No unpublished assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} unpublished assignments`);

      const transformedData = data.map(this.transformAssignmentData);
      console.log('[OptimizedAssignmentService] Sample transformed data:', transformedData[0]);

      return transformedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching unpublished assignments:', error);
      throw error;
    }
  }

  static async fetchUserAssignments(userId: string, role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching assignments for user ${userId} with role ${role}`);
      
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
          updated_at,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          ),
          assignment_employees:assignments_employees(
            user_id,
            profiles(
              id,
              name
            )
          ),
          assignment_cars:cars!assignments_car_ids_fkey(
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} assignments`);

      const transformedData = data.map(this.transformAssignmentData);
      console.log('[OptimizedAssignmentService] Sample transformed data:', transformedData[0]);

      return transformedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching user assignments:', error);
      throw error;
    }
  }
}
