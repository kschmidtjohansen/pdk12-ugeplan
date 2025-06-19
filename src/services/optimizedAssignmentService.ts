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

  // FIXED: Single optimized query to fetch ALL assignment data without user filtering
  async fetchAssignmentsOptimized(includeUnpublished: boolean = true): Promise<OptimizedAssignmentData> {
    const cacheKey = `optimized_assignments_${includeUnpublished}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    console.log('[OptimizedAssignmentService] Fetching ALL assignments for all users...');
    
    // FIXED: Fetch ALL assignments without any user-based filtering
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
        updated_at
      `)
      .order('assignment_date', { ascending: true });

    if (!includeUnpublished) {
      assignmentQuery = assignmentQuery.eq('published', true);
    }

    const { data: assignments, error: assignmentError } = await assignmentQuery;
    if (assignmentError) {
      console.error('[OptimizedAssignmentService] Assignment query error:', assignmentError);
      throw assignmentError;
    }

    if (!assignments || assignments.length === 0) {
      console.log('[OptimizedAssignmentService] No assignments found');
      const emptyData = { assignments: [], employeeLookup: new Map(), carLookup: new Map() };
      this.cache.set(cacheKey, { data: emptyData, timestamp: Date.now() });
      return emptyData;
    }

    console.log(`[OptimizedAssignmentService] Successfully fetched ${assignments.length} assignments for ALL users`);

    // Batch fetch all related data in parallel
    const assignmentIds = assignments.map(a => a.id);
    const allCarIds = new Set<string>();
    const responsibleUserIds = new Set<string>();
    
    assignments.forEach(assignment => {
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
      }
      if (assignment.car_id) {
        allCarIds.add(assignment.car_id);
      }
      if (assignment.responsible_user_id) {
        responsibleUserIds.add(assignment.responsible_user_id);
      }
    });

    // FIXED: Parallel queries for complete data aggregation
    const [employeeResult, carResult, responsibleUsersResult] = await Promise.all([
      // Fetch ALL assignment-employee relationships
      supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds),
      
      // Fetch car data
      allCarIds.size > 0 ? supabase
        .from('cars')
        .select('id, name, car_number')
        .in('id', Array.from(allCarIds)) : { data: [], error: null },

      // Fetch responsible users
      responsibleUserIds.size > 0 ? supabase
        .from('profiles')
        .select('id, name')
        .in('id', Array.from(responsibleUserIds)) : { data: [], error: null }
    ]);

    if (employeeResult.error) {
      console.error('[OptimizedAssignmentService] Employee result error:', employeeResult.error);
      throw employeeResult.error;
    }
    if (carResult.error) {
      console.error('[OptimizedAssignmentService] Car result error:', carResult.error);
      throw carResult.error;
    }
    if (responsibleUsersResult.error) {
      console.error('[OptimizedAssignmentService] Responsible users error:', responsibleUsersResult.error);
      throw responsibleUsersResult.error;
    }

    // Get ALL unique user IDs from assignments_employees for complete data
    const userIds = employeeResult.data ? [...new Set(employeeResult.data.map(ae => ae.user_id))] : [];
    
    // Fetch ALL profiles for complete employee data
    const { data: profiles, error: profilesError } = userIds.length > 0 
      ? await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error('[OptimizedAssignmentService] Profiles error:', profilesError);
      throw profilesError;
    }

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

    // Create responsible users map
    const responsibleUsersMap = new Map<string, Profile>();
    if (responsibleUsersResult.data) {
      responsibleUsersResult.data.forEach(user => {
        if (user && typeof user === 'object' && 'id' in user && 'name' in user) {
          responsibleUsersMap.set(user.id, user as Profile);
        }
      });
    }

    // FIXED: Process ALL employee data with complete profile lookup
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

    // FIXED: Transform assignments with complete lookup data for ALL users
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

      // Properly lookup responsible user
      const responsibleUser = assignment.responsible_user_id 
        ? responsibleUsersMap.get(assignment.responsible_user_id)
        : null;

      console.log(`[OptimizedAssignmentService] Assignment "${assignment.title}": employees=[${assignmentEmployees.join(', ')}], responsibleUser=${responsibleUser?.name || 'none'}`);

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
        employees: assignmentEmployees, // Complete employee list for ALL assignments
        published: assignment.published || false,
        responsibleUser: responsibleUser ? {
          id: responsibleUser.id,
          name: responsibleUser.name
        } : null
      };
    });

    console.log(`[OptimizedAssignmentService] Successfully transformed ${processedAssignments.length} assignments with COMPLETE employee data for all users`);

    const optimizedData = {
      assignments: processedAssignments,
      employeeLookup,
      carLookup
    };

    this.cache.set(cacheKey, { data: optimizedData, timestamp: Date.now() });
    console.log('[OptimizedAssignmentService] Cached complete assignment data for all users');
    
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
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }

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
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }

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
          published: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
      
      await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);
      
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
      await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      this.invalidateCache('assignments');
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
      return false;
    }
  }
}

export const optimizedAssignmentService = new OptimizedAssignmentService();
