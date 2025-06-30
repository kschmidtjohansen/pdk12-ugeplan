import { supabase } from '@/integrations/supabase/client';
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
  car_id: string | null;
  car_ids: string[] | null;
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

  private static async fetchAssignmentEmployees(assignmentIds: string[]) {
    if (assignmentIds.length === 0) return [];
    
    try {
      // Use separate queries to avoid join issues
      const { data: assignmentEmployeeData, error: employeeError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeeError) {
        console.warn('[OptimizedAssignmentService] Assignment employees fetch error:', employeeError);
        return [];
      }

      if (!assignmentEmployeeData || assignmentEmployeeData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(assignmentEmployeeData.map(emp => emp.user_id))];
      
      // Fetch profiles separately with error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('[OptimizedAssignmentService] Profiles fetch error:', profilesError);
        // Return with fallback names even if profiles fetch fails
        return assignmentEmployeeData.map(emp => ({
          assignment_id: emp.assignment_id,
          user_id: emp.user_id,
          profiles: { id: emp.user_id, name: `User ${emp.user_id.substring(0, 8)}` }
        }));
      }

      // Combine the data with proper fallbacks
      return assignmentEmployeeData.map(emp => ({
        assignment_id: emp.assignment_id,
        user_id: emp.user_id,
        profiles: profilesData?.find(profile => profile.id === emp.user_id) || 
                 { id: emp.user_id, name: `User ${emp.user_id.substring(0, 8)}` }
      }));
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching assignment employees:', error);
      return [];
    }
  }

  private static async fetchAssignmentCars(carIds: string[]) {
    if (carIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, name')
        .in('id', carIds);

      if (error) {
        console.warn('[OptimizedAssignmentService] Cars fetch error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching cars:', error);
      return [];
    }
  }

  private static async enrichAssignmentData(assignments: any[]): Promise<OptimizedAssignmentData[]> {
    const assignmentIds = assignments.map(a => a.id);
    
    // Fetch employees with comprehensive error handling
    const employeesData = await this.fetchAssignmentEmployees(assignmentIds);
    
    // Collect all car IDs (both legacy car_id and new car_ids array)
    const allCarIds = new Set<string>();
    assignments.forEach(assignment => {
      if (assignment.car_id) {
        allCarIds.add(assignment.car_id);
      }
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
      }
    });
    
    // Fetch cars with comprehensive error handling
    const carsData = await this.fetchAssignmentCars(Array.from(allCarIds));
    
    // Enrich assignments with employee and car data
    return assignments.map(assignment => {
      // Get employees for this assignment
      const assignmentEmployees = employeesData
        .filter(emp => emp.assignment_id === assignment.id)
        .map(emp => ({
          user_id: emp.user_id,
          profiles: emp.profiles
        }));
      
      // Get cars for this assignment (handle both legacy and new format)
      let assignmentCars: { id: string; name: string; }[] = [];
      
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        // New format: multiple cars in array
        assignmentCars = assignment.car_ids
          .map((carId: string) => carsData.find(car => car.id === carId))
          .filter(Boolean)
          .map((car: any) => ({ id: car.id, name: car.name }));
      } else if (assignment.car_id) {
        // Legacy format: single car
        const car = carsData.find(car => car.id === assignment.car_id);
        if (car) {
          assignmentCars = [{ id: car.id, name: car.name }];
        }
      }
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        assignment_date: assignment.assignment_date,
        from_time: assignment.from_time,
        to_time: assignment.to_time,
        location: assignment.location,
        type: assignment.type,
        published: assignment.published,
        responsible_user_id: assignment.responsible_user_id,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        car_id: assignment.car_id,
        car_ids: assignment.car_ids,
        responsible_user: assignment.responsible_user,
        assignment_employees: assignmentEmployees,
        assignment_cars: assignmentCars
      };
    });
  }

  static async fetchAllAssignments(role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching all assignments for role: ${role}`);

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
          car_id,
          car_ids,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} assignments`);
      
      // Enrich with employee and car data
      const enrichedData = await this.enrichAssignmentData(data);
      console.log('[OptimizedAssignmentService] Sample enriched data:', enrichedData[0]);

      return enrichedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
      throw error;
    }
  }

  static async fetchAllPublishedAssignments(): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Fetching ALL published assignments for servicemedarbejder');
      
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
          car_id,
          car_ids,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          )
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No published assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} published assignments for servicemedarbejder`);
      
      // Enrich with employee and car data
      const enrichedData = await this.enrichAssignmentData(data);
      console.log('[OptimizedAssignmentService] SERVICEMEDARBEJDER - Sample enriched data:', enrichedData[0]);
      
      return enrichedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all published assignments:', error);
      throw error;
    }
  }

  static async fetchPublishedAssignments(userId: string, role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching published assignments for user ${userId} with role ${role}`);

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
          car_id,
          car_ids,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          )
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No published assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} published assignments`);

      // Enrich with employee and car data
      const enrichedData = await this.enrichAssignmentData(data);
      console.log('[OptimizedAssignmentService] Sample enriched data:', enrichedData[0]);

      return enrichedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching published assignments:', error);
      throw error;
    }
  }

  static async fetchUserSpecificPublishedAssignments(userId: string, userName: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching published assignments for servicemedarbejder user: ${userName} (${userId})`);
      
      // First, get all published assignments
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
          car_id,
          car_ids,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          )
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No published assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} published assignments, now filtering for user assignment`);
      
      // Enrich with employee and car data
      const enrichedData = await this.enrichAssignmentData(data);
      
      // CRITICAL FIX: Filter to only assignments where the user is assigned as an employee
      const userSpecificAssignments = enrichedData.filter(assignment => {
        const isAssignedEmployee = assignment.assignment_employees.some(emp => 
          emp.user_id === userId || emp.profiles.name === userName
        );
        
        console.log(`[OptimizedAssignmentService] Assignment "${assignment.title}":`, {
          employees: assignment.assignment_employees.map(emp => emp.profiles.name),
          isAssignedEmployee,
          userName,
          userId
        });
        
        return isAssignedEmployee;
      });
      
      console.log(`[OptimizedAssignmentService] SERVICEMEDARBEJDER filtered results: ${userSpecificAssignments.length} assignments where user is assigned`);
      
      return userSpecificAssignments;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching user-specific published assignments:', error);
      throw error;
    }
  }

  static async fetchUnpublishedAssignments(userId: string, role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching unpublished assignments for user ${userId} with role ${role}`);

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
          car_id,
          car_ids,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          )
        `)
        .eq('published', false)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No unpublished assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} unpublished assignments`);

      // Enrich with employee and car data
      const enrichedData = await this.enrichAssignmentData(data);
      console.log('[OptimizedAssignmentService] Sample enriched data:', enrichedData[0]);

      return enrichedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching unpublished assignments:', error);
      throw error;
    }
  }

  static async fetchUserAssignments(userId: string, role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log(`[OptimizedAssignmentService] Fetching assignments for user ${userId} with role ${role}`);
      
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
          car_id,
          car_ids,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No assignments found');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Found ${data.length} assignments`);

      // Enrich with employee and car data
      const enrichedData = await this.enrichAssignmentData(data);
      console.log('[OptimizedAssignmentService] Sample enriched data:', enrichedData[0]);

      return enrichedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching user assignments:', error);
      throw error;
    }
  }

  static async publishAssignment(id: string): Promise<void> {
    try {
      console.log(`[OptimizedAssignmentService] Publishing assignment: ${id}`);
      
      const { error } = await supabase
        .from('assignments')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[OptimizedAssignmentService] Error publishing assignment:', error);
        throw new Error(`Failed to publish assignment: ${error.message}`);
      }

      // Clear cache to ensure fresh data
      this.clearCache();
      console.log(`[OptimizedAssignmentService] Successfully published assignment: ${id}`);
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error in publishAssignment:', error);
      throw error;
    }
  }

  static async publishAssignmentsByDate(date: string): Promise<void> {
    try {
      console.log(`[OptimizedAssignmentService] Publishing all assignments for date: ${date}`);
      
      const { error } = await supabase
        .from('assignments')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('assignment_date', date)
        .eq('published', false);

      if (error) {
        console.error('[OptimizedAssignmentService] Error publishing assignments by date:', error);
        throw new Error(`Failed to publish assignments for date ${date}: ${error.message}`);
      }

      // Clear cache to ensure fresh data
      this.clearCache();
      console.log(`[OptimizedAssignmentService] Successfully published all assignments for date: ${date}`);
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error in publishAssignmentsByDate:', error);
      throw error;
    }
  }
}
