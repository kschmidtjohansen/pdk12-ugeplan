
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
    console.log('[OptimizedAssignmentService] CRITICAL FIX - Fetching assignments with filter:', filter, 'userId:', userId, 'userRole:', userRole);

    try {
      // CRITICAL FIX: Use simple, reliable query structure without problematic foreign key references
      let query = supabase
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
          responsible_user_id
        `);

      // Apply appropriate filters based on context and user role
      if (filter === 'user' && userId) {
        // Dashboard context: Show only user's assignments
        console.log('[OptimizedAssignmentService] CRITICAL FIX - Dashboard context: user filter for', userId);
        const { data: userAssignments } = await supabase
          .from('assignments_employees')
          .select('assignment_id')
          .eq('user_id', userId);
        
        const assignmentIds = userAssignments?.map(ua => ua.assignment_id) || [];
        
        if (assignmentIds.length > 0) {
          query = query.or(`id.in.(${assignmentIds.join(',')}),responsible_user_id.eq.${userId}`);
        } else {
          query = query.eq('responsible_user_id', userId);
        }
      } else if (filter === 'all') {
        // CRITICAL FIX: Planner context - show based on user role
        if (userRole === 'servicemedarbejder') {
          // CRITICAL FIX: Servicemedarbejder should see ALL published assignments in planner
          console.log('[OptimizedAssignmentService] CRITICAL FIX - Planner: Showing ALL published assignments for servicemedarbejder');
          query = query.eq('published', true);
        } else {
          // Admin/skadeleder can see everything in planner
          console.log('[OptimizedAssignmentService] CRITICAL FIX - Planner: Showing all assignments for admin/skadeleder');
          // No filter - they see everything
        }
      } else if (filter === 'published') {
        query = query.eq('published', true);
      } else if (filter === 'unpublished') {
        query = query.eq('published', false);
      }

      const { data: assignments, error: assignmentsError } = await query.order('assignment_date', { ascending: true });

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] CRITICAL FIX - Assignment query error:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] CRITICAL FIX - No assignments found');
        return [];
      }

      console.log('[OptimizedAssignmentService] CRITICAL FIX - Found assignments:', assignments.length);

      // Get assignment IDs for related data queries
      const assignmentIds = assignments.map(a => a.id);

      // CRITICAL FIX: Fetch assignment employees separately with reliable query
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select(`
          assignment_id,
          user_id,
          profiles!inner(
            id,
            name,
            email
          )
        `)
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] CRITICAL FIX - Employee fetch warning:', employeesError);
      }

      // CRITICAL FIX: Fetch responsible users separately
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
          console.warn('[OptimizedAssignmentService] CRITICAL FIX - Responsible users fetch warning:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // CRITICAL FIX: Fetch cars separately
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id, name, car_number');

      if (carsError) {
        console.warn('[OptimizedAssignmentService] CRITICAL FIX - Cars fetch warning:', carsError);
      }

      // CRITICAL FIX: Process assignments with reliable data mapping
      const result = assignments.map(assignment => {
        // Map employees for this assignment
        const assignmentEmployeeData = assignmentEmployees?.filter(
          emp => emp.assignment_id === assignment.id
        ) || [];

        const employees: AssignmentEmployee[] = assignmentEmployeeData
          .map(emp => {
            if (emp.profiles && typeof emp.profiles === 'object') {
              return {
                id: emp.profiles.id,
                name: emp.profiles.name,
                email: emp.profiles.email
              };
            }
            return null;
          })
          .filter(emp => emp !== null) as AssignmentEmployee[];

        // Map responsible user
        const responsibleUser = assignment.responsible_user_id 
          ? responsibleUsers.find(user => user.id === assignment.responsible_user_id)
          : null;

        // Map cars (simplified for now, focusing on core functionality)
        const assignmentCars: AssignmentCar[] = [];

        const processedAssignment: OptimizedAssignmentData = {
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
          cars: assignmentCars,
          responsible_user: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name,
            email: responsibleUser.email
          } : undefined
        };

        console.log(`[OptimizedAssignmentService] CRITICAL FIX - Assignment ${assignment.title}: employees [${employees.map(e => e.name).join(', ')}], published: ${assignment.published}`);

        return processedAssignment;
      });

      console.log('[OptimizedAssignmentService] CRITICAL FIX - Final processed assignments:', result.length);
      console.log('[OptimizedAssignmentService] CRITICAL FIX - Filter applied:', filter, 'User role:', userRole);

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] CRITICAL FIX - Critical error:', err);
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
