
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
    console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Fetching assignments with filter:', filter, 'userId:', userId, 'userRole:', userRole);

    // Build the base query with all necessary relationships
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
        responsible_user_id,
        assignments_employees(
          user_id,
          profiles(
            id,
            name,
            email
          )
        ),
        cars(
          id,
          name,
          car_number
        ),
        responsible_user:profiles!assignments_responsible_user_id_fkey(
          id,
          name,
          email
        )
      `);

    // COMPREHENSIVE FIX: Apply appropriate filters based on context and user role
    if (filter === 'user' && userId) {
      // Dashboard context: Show only user's assignments but preserve ALL colleague names
      console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Dashboard context: user filter for', userId);
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
      // COMPREHENSIVE FIX: Planner context - show based on user role
      if (userRole === 'servicemedarbejder') {
        // CRITICAL FIX: Servicemedarbejder should see ALL published assignments in planner
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Planner: Showing ALL published assignments for servicemedarbejder');
        query = query.eq('published', true);
      } else {
        // Admin/skadeleder can see everything in planner
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Planner: Showing all assignments for admin/skadeleder');
        // No filter - they see everything
      }
    } else if (filter === 'published') {
      query = query.eq('published', true);
    } else if (filter === 'unpublished') {
      query = query.eq('published', false);
    }

    const { data, error } = await query.order('assignment_date', { ascending: true });

    if (error) {
      console.error('[OptimizedAssignmentService] Database error:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Raw query result:', data.length, 'rows');

    // Transform and deduplicate the results - PRESERVE ALL EMPLOYEE NAMES
    const assignmentMap = new Map<string, OptimizedAssignmentData>();

    data.forEach((row: any) => {
      if (!assignmentMap.has(row.id)) {
        // Initialize assignment with empty arrays
        assignmentMap.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          location: row.location,
          assignment_date: row.assignment_date,
          from_time: row.from_time,
          to_time: row.to_time,
          type: row.type,
          published: row.published,
          created_at: row.created_at,
          updated_at: row.updated_at,
          responsible_user_id: row.responsible_user_id,
          employees: [],
          cars: row.cars ? (Array.isArray(row.cars) ? row.cars : [row.cars]).filter(Boolean) : [],
          responsible_user: row.responsible_user || undefined
        });
      }

      const assignment = assignmentMap.get(row.id)!;

      // COMPREHENSIVE FIX: Add ALL employees from assignments_employees relationship
      if (row.assignments_employees && Array.isArray(row.assignments_employees)) {
        row.assignments_employees.forEach((ae: any) => {
          if (ae.profiles) {
            const employee = {
              id: ae.profiles.id,
              name: ae.profiles.name,
              email: ae.profiles.email
            };
            
            // Check if employee is already added to avoid duplicates
            const exists = assignment.employees.some(emp => emp.id === employee.id);
            if (!exists) {
              assignment.employees.push(employee);
              console.log(`[OptimizedAssignmentService] COMPREHENSIVE FIX - Added employee ${employee.name} to assignment ${assignment.title}`);
            }
          }
        });
      }
    });

    const result = Array.from(assignmentMap.values());
    
    console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Final processed assignments:', result.length);
    console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Filter applied:', filter, 'User role:', userRole);
    
    // Log detailed assignment info for debugging
    result.forEach(assignment => {
      console.log(`[OptimizedAssignmentService] COMPREHENSIVE FIX - Assignment ${assignment.title}: employees [${assignment.employees.map(e => e.name).join(', ')}], published: ${assignment.published}`);
    });

    return result;
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
