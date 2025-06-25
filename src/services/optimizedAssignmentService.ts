
import { supabase } from '@/integrations/supabase/client';

export interface AssignmentEmployee {
  id: string;
  name: string;
  email: string;
}

export interface AssignmentCar {
  id: string;
  name: string;
  car_number: string;
}

export interface ResponsibleUser {
  id: string;
  name: string;
  email: string;
}

export interface OptimizedAssignmentData {
  id: string;
  title: string;
  description: string;
  location: string;
  assignment_date: string;
  from_time: string;
  to_time: string;
  type: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  responsible_user_id: string | null;
  employees: AssignmentEmployee[];
  cars: AssignmentCar[];
  responsible_user?: ResponsibleUser;
}

export class OptimizedAssignmentService {
  static async fetchAssignmentsWithFilter(filter: string, userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    console.log('[OptimizedAssignmentService] CAR FIX - Starting fetch with:', { filter, userId, userRole });

    try {
      let assignmentsQuery = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          location,
          assignment_date,
          from_time,
          to_time,
          type,
          published,
          created_at,
          updated_at,
          responsible_user_id,
          car_id,
          car_ids
        `)
        .order('assignment_date', { ascending: true });

      // CAR FIX: Simplified filter logic to ensure all users see appropriate data
      if (filter === 'user' && userId) {
        // DASHBOARD: Get assignments where user is assigned OR responsible
        console.log('[OptimizedAssignmentService] CAR FIX - Dashboard: Getting user assignments');
        
        const { data: userAssignmentIds } = await supabase
          .from('assignments_employees')
          .select('assignment_id')
          .eq('user_id', userId);
        
        const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
        
        if (assignmentIds.length > 0) {
          assignmentsQuery = assignmentsQuery.or(`id.in.(${assignmentIds.join(',')}),responsible_user_id.eq.${userId}`);
        } else {
          assignmentsQuery = assignmentsQuery.eq('responsible_user_id', userId);
        }
        
        // Only show published assignments to regular users
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'published') {
        // CAR FIX: Show ALL published assignments - NO user filtering
        console.log('[OptimizedAssignmentService] CAR FIX - Getting ALL published assignments');
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'all') {
        // ADMIN/SKADELEDER: Show ALL assignments
        console.log('[OptimizedAssignmentService] CAR FIX - Admin: Getting ALL assignments');
        
      } else if (filter === 'unpublished') {
        assignmentsQuery = assignmentsQuery.eq('published', false);
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] CAR FIX - Query error:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] CAR FIX - No assignments found for filter:', filter);
        return [];
      }

      console.log('[OptimizedAssignmentService] CAR FIX - Retrieved assignments:', assignments.length);

      // CAR FIX: Get ALL employee relationships for ALL retrieved assignments
      const assignmentIds = assignments.map(a => a.id);
      
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] CAR FIX - Employee relationships error:', employeesError);
      }

      // CAR FIX: Get ALL employee profiles to display complete names
      const allEmployeeUserIds = assignmentEmployees?.map(ae => ae.user_id) || [];
      const uniqueEmployeeIds = [...new Set(allEmployeeUserIds)];
      
      let employeeProfiles: any[] = [];
      if (uniqueEmployeeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueEmployeeIds);

        if (profilesError) {
          console.warn('[OptimizedAssignmentService] CAR FIX - Employee profiles error:', profilesError);
        } else {
          employeeProfiles = profiles || [];
        }
      }

      // CAR FIX: Get car data for assignments
      const allCarIds = new Set<string>();
      assignments.forEach(assignment => {
        // Handle legacy car_id field
        if (assignment.car_id) {
          allCarIds.add(assignment.car_id);
        }
        // Handle new car_ids array field
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
        }
      });

      let carData: any[] = [];
      if (allCarIds.size > 0) {
        const { data: cars, error: carsError } = await supabase
          .from('cars')
          .select('id, name, car_number')
          .in('id', Array.from(allCarIds));

        if (carsError) {
          console.warn('[OptimizedAssignmentService] CAR FIX - Cars data error:', carsError);
        } else {
          carData = cars || [];
        }
      }

      console.log('[OptimizedAssignmentService] CAR FIX - Car data fetched:', carData.length);

      // Get responsible user profiles
      const responsibleUserIds = assignments
        .map(a => a.responsible_user_id)
        .filter(id => id !== null);

      let responsibleUsers: any[] = [];
      if (responsibleUserIds.length > 0) {
        const { data: respUsers, error: respError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', responsibleUserIds);

        if (respError) {
          console.warn('[OptimizedAssignmentService] CAR FIX - Responsible users error:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // CAR FIX: Build complete assignment data with ALL information
      const result = assignments.map(assignment => {
        // Get ALL employees for this assignment
        const assignmentEmployeeRelations = assignmentEmployees?.filter(
          ae => ae.assignment_id === assignment.id
        ) || [];

        // Build complete employee list with ALL names
        const employees: AssignmentEmployee[] = assignmentEmployeeRelations
          .map(relation => {
            const profile = employeeProfiles.find(p => p.id === relation.user_id);
            if (profile) {
              return {
                id: profile.id,
                name: profile.name,
                email: profile.email
              };
            }
            return null;
          })
          .filter(emp => emp !== null) as AssignmentEmployee[];

        // CAR FIX: Build complete car list
        const assignmentCarIds = new Set<string>();
        if (assignment.car_id) {
          assignmentCarIds.add(assignment.car_id);
        }
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach((carId: string) => assignmentCarIds.add(carId));
        }

        const cars: AssignmentCar[] = Array.from(assignmentCarIds)
          .map(carId => {
            const car = carData.find(c => c.id === carId);
            if (car) {
              return {
                id: car.id,
                name: car.name,
                car_number: car.car_number
              };
            }
            return null;
          })
          .filter(car => car !== null) as AssignmentCar[];

        // Special logging for car assignments
        if (cars.length > 0) {
          console.log(`[OptimizedAssignmentService] CAR FIX - 🚗 Assignment with cars:`, {
            title: assignment.title,
            date: assignment.assignment_date,
            carCount: cars.length,
            carNames: cars.map(c => c.name)
          });
        }

        const responsibleUser = assignment.responsible_user_id 
          ? responsibleUsers.find(user => user.id === assignment.responsible_user_id)
          : null;

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          location: assignment.location,
          assignment_date: assignment.assignment_date,
          from_time: assignment.from_time,
          to_time: assignment.to_time,
          type: assignment.type || 'other',
          published: assignment.published || false,
          created_at: assignment.created_at,
          updated_at: assignment.updated_at,
          responsible_user_id: assignment.responsible_user_id,
          employees: employees,
          cars: cars,
          responsible_user: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name,
            email: responsibleUser.email
          } : undefined
        };
      });

      console.log('[OptimizedAssignmentService] CAR FIX - Complete result:', {
        filter,
        totalAssignments: result.length,
        assignmentsWithCars: result.filter(a => a.cars.length > 0).length
      });

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] CAR FIX - Critical error:', err);
      throw err;
    }
  }

  static async fetchUserAssignments(userId: string): Promise<OptimizedAssignmentData[]> {
    return this.fetchAssignmentsWithFilter('user', userId);
  }

  static async fetchAllAssignments(userRole?: string): Promise<OptimizedAssignmentData[]> {
    return this.fetchAssignmentsWithFilter('all', undefined, userRole);
  }

  static async fetchPublishedAssignments(): Promise<OptimizedAssignmentData[]> {
    return this.fetchAssignmentsWithFilter('published');
  }

  static async fetchUnpublishedAssignments(): Promise<OptimizedAssignmentData[]> {
    return this.fetchAssignmentsWithFilter('unpublished');
  }
}
