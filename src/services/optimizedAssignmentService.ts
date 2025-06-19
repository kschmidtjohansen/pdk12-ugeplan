
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';

interface OptimizedAssignmentData {
  assignments: Assignment[];
  employeeLookup: Map<string, string[]>;
  carLookup: Map<string, any>;
}

interface Profile {
  id: string;
  name: string;
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
      // Fetch assignment-employee relationships
      supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds),
      
      // Fetch car data
      allCarIds.size > 0 ? supabase
        .from('cars')
        .select('id, name, car_number')
        .in('id', Array.from(allCarIds)) : { data: [], error: null }
    ]);

    if (employeeResult.error) throw employeeResult.error;
    if (carResult.error) throw carResult.error;

    // Get all unique user IDs from assignments_employees
    const userIds = employeeResult.data ? [...new Set(employeeResult.data.map(ae => ae.user_id))] : [];
    
    // Fetch profiles for all users in a separate query
    const { data: profiles, error: profilesError } = userIds.length > 0 
      ? await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    // Build lookup maps for O(1) access
    const employeeLookup = new Map<string, string[]>();
    const carLookup = new Map<string, any>();
    
    // Create profiles map with proper typing
    const profilesMap = new Map<string, Profile>();
    if (profiles) {
      profiles.forEach(profile => {
        if (profile && typeof profile === 'object' && 'id' in profile && 'name' in profile) {
          profilesMap.set(profile.id, profile as Profile);
        }
      });
    }

    // Process employee data with profile lookup
    if (employeeResult.data) {
      employeeResult.data.forEach(ae => {
        if (!employeeLookup.has(ae.assignment_id)) {
          employeeLookup.set(ae.assignment_id, []);
        }
        const profile = profilesMap.get(ae.user_id);
        if (profile && profile.name) {
          employeeLookup.get(ae.assignment_id)?.push(profile.name);
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

  // Optimistic create method
  async createAssignmentOptimistic(assignmentData: Partial<Assignment>): Promise<boolean> {
    console.log('[OptimizedAssignmentService] Creating assignment optimistically:', assignmentData);
    
    try {
      // Format responsible user ID
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }

      // Transform car data for database
      let carId = null;
      let carIds = null;

      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
          carIds = [assignmentData.car];
        } else if (assignmentData.car && typeof assignmentData.car === 'object' && 'id' in assignmentData.car) {
          carId = assignmentData.car.id;
          carIds = [assignmentData.car.id];
        }
      }
      
      // Insert the new assignment
      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          car_ids: carIds,
          responsible_user_id: responsibleUserId,
          published: assignmentData.published || false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Handle employee assignments
      if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment?.id) {
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          if (typeof employeeName !== 'string' || employeeName.trim() === '') continue;
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName.trim())
            .single();
            
          if (profileError || !profile?.id) continue;
          
          employeeInserts.push({
            assignment_id: newAssignment.id,
            user_id: profile.id
          });
        }
        
        if (employeeInserts.length > 0) {
          await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
        }
      }
      
      // Invalidate cache
      this.invalidateCache('assignments');
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error creating assignment:', error);
      return false;
    }
  }

  // Optimistic update method
  async updateAssignmentOptimistic(assignmentId: string, assignmentData: Partial<Assignment>): Promise<boolean> {
    console.log('[OptimizedAssignmentService] Updating assignment optimistically:', assignmentId);
    
    try {
      // Format responsible user ID
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }

      // Transform car data for database
      let carId = null;
      let carIds = null;

      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
          carIds = [assignmentData.car];
        } else if (assignmentData.car && typeof assignmentData.car === 'object' && 'id' in assignmentData.car) {
          carId = assignmentData.car.id;
          carIds = [assignmentData.car.id];
        }
      }
      
      // Update the assignment - ALWAYS unpublish when editing
      const { error } = await supabase
        .from('assignments')
        .update({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          car_ids: carIds,
          responsible_user_id: responsibleUserId,
          published: false, // Always unpublish when editing
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
      
      // Remove existing employee assignments
      await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);
      
      // Handle employee assignments
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          if (typeof employeeName !== 'string') continue;
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName)
            .single();
            
          if (profileError || !profile?.id) continue;
          
          employeeInserts.push({
            assignment_id: assignmentId,
            user_id: profile.id
          });
        }
        
        if (employeeInserts.length > 0) {
          await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
        }
      }
      
      // Invalidate cache
      this.invalidateCache('assignments');
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error updating assignment:', error);
      return false;
    }
  }

  // Optimistic publish methods
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

  async publishAssignmentsByDateOptimistic(date: string): Promise<boolean> {
    console.log('[OptimizedAssignmentService] Publishing day optimistically:', date);
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('assignment_date', date)
        .eq('published', false);

      if (error) throw error;
      
      // Selectively invalidate cache
      this.invalidateCache('assignments');
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error publishing assignments by date:', error);
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
