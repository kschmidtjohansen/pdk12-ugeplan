
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';

interface OptimizedAssignmentData {
  assignments: Assignment[];
  employeeLookup: Map<string, string[]>;
  carLookup: Map<string, any>;
}

class OptimizedAssignmentService {
  private cache = new Map<string, { data: OptimizedAssignmentData; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Single optimized query to fetch all assignment data with relationships
  async fetchAssignmentsOptimized(includeUnpublished: boolean = true): Promise<OptimizedAssignmentData> {
    const cacheKey = `optimized_assignments_${includeUnpublished}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    console.log('[OptimizedAssignmentService] Fetching assignments with optimized query...');
    
    // Fetch assignments with joins in a single query
    let assignmentQuery = supabase
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
        responsible_user:responsible_user_id (
          id,
          name
        )
      `)
      .order('assignment_date', { ascending: true });

    if (!includeUnpublished) {
      assignmentQuery = assignmentQuery.eq('published', true);
    }

    const { data: assignments, error: assignmentError } = await assignmentQuery;
    if (assignmentError) throw assignmentError;

    if (!assignments || assignments.length === 0) {
      const emptyData = { assignments: [], employeeLookup: new Map(), carLookup: new Map() };
      this.cache.set(cacheKey, { data: emptyData, timestamp: Date.now() });
      return emptyData;
    }

    // Batch fetch all related data in parallel
    const assignmentIds = assignments.map(a => a.id);
    const allCarIds = new Set<string>();
    
    assignments.forEach(assignment => {
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
      }
      if (assignment.car_id) {
        allCarIds.add(assignment.car_id);
      }
    });

    // Parallel queries for optimal performance
    const [employeeResult, carResult] = await Promise.all([
      // Fetch assignment-employee relationships with profile data in one query
      supabase
        .from('assignments_employees')
        .select(`
          assignment_id,
          user_id,
          profiles!assignments_employees_user_id_fkey (
            id,
            name
          )
        `)
        .in('assignment_id', assignmentIds),
      
      // Fetch car data
      allCarIds.size > 0 ? supabase
        .from('cars')
        .select('id, name, car_number')
        .in('id', Array.from(allCarIds)) : { data: [], error: null }
    ]);

    if (employeeResult.error) throw employeeResult.error;
    if (carResult.error) throw carResult.error;

    // Build lookup maps for O(1) access
    const employeeLookup = new Map<string, string[]>();
    const carLookup = new Map<string, any>();

    // Process employee data
    if (employeeResult.data) {
      employeeResult.data.forEach(ae => {
        if (!employeeLookup.has(ae.assignment_id)) {
          employeeLookup.set(ae.assignment_id, []);
        }
        if (ae.profiles?.name) {
          employeeLookup.get(ae.assignment_id)?.push(ae.profiles.name);
        }
      });
    }

    // Process car data
    if (carResult.data) {
      carResult.data.forEach(car => {
        carLookup.set(car.id, car);
      });
    }

    // Transform assignments with lookup data
    const processedAssignments: Assignment[] = assignments.map(assignment => {
      const assignmentEmployees = employeeLookup.get(assignment.id) || [];
      
      let carData = null;
      let carsArray: string[] = [];
      
      if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
        carsArray = assignment.car_ids;
        const firstCar = carLookup.get(assignment.car_ids[0]);
        if (firstCar) {
          carData = { id: firstCar.id, name: firstCar.name };
        }
      } else if (assignment.car_id) {
        carsArray = [assignment.car_id];
        const car = carLookup.get(assignment.car_id);
        if (car) {
          carData = { id: car.id, name: car.name };
        }
      }

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        date: assignment.assignment_date,
        fromTime: assignment.from_time,
        toTime: assignment.to_time,
        location: assignment.location,
        car: carData,
        cars: carsArray,
        employees: assignmentEmployees,
        published: assignment.published || false,
        responsibleUser: assignment.responsible_user ? {
          id: assignment.responsible_user.id,
          name: assignment.responsible_user.name
        } : null
      };
    });

    const optimizedData = {
      assignments: processedAssignments,
      employeeLookup,
      carLookup
    };

    this.cache.set(cacheKey, { data: optimizedData, timestamp: Date.now() });
    console.log('[OptimizedAssignmentService] Cached optimized assignment data');
    
    return optimizedData;
  }

  // Selective cache invalidation
  invalidateCache(pattern?: string) {
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

  // Optimistic update methods
  async publishAssignmentOptimistic(assignmentId: string): Promise<boolean> {
    console.log('[OptimizedAssignmentService] Publishing assignment optimistically:', assignmentId);
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;
      
      // Selectively invalidate cache
      this.invalidateCache('assignments');
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error publishing assignment:', error);
      return false;
    }
  }

  async deleteAssignmentOptimistic(assignmentId: string): Promise<boolean> {
    console.log('[OptimizedAssignmentService] Deleting assignment optimistically:', assignmentId);
    
    try {
      // Delete employee associations first
      await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);

      // Delete assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      // Selectively invalidate cache
      this.invalidateCache('assignments');
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
      return false;
    }
  }
}

export const optimizedAssignmentService = new OptimizedAssignmentService();
