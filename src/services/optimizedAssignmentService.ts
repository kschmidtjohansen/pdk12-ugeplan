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
    console.log('[OptimizedAssignmentService] FRESH APPROACH - Starting fetch with:', { filter, userId, userRole });

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
          responsible_user_id
        `)
        .order('assignment_date', { ascending: true });

      // FRESH APPROACH: Clear, simple filtering logic
      if (filter === 'user' && userId) {
        // DASHBOARD: Get user's assignments (both assigned and responsible)
        console.log('[OptimizedAssignmentService] FRESH APPROACH - Dashboard: fetching user assignments for', userId);
        
        // Get assignment IDs where user is assigned
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
        
        // Only published assignments for dashboard
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'published') {
        // PLANNER: ALL published assignments (no user filtering)
        console.log('[OptimizedAssignmentService] FRESH APPROACH - Planner: fetching ALL published assignments');
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'all') {
        // PLANNER: ALL assignments for admin/skadeleder
        console.log('[OptimizedAssignmentService] FRESH APPROACH - Planner: fetching ALL assignments');
        // No additional filter
        
      } else if (filter === 'unpublished') {
        assignmentsQuery = assignmentsQuery.eq('published', false);
      }

      // Execute assignments query
      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] FRESH APPROACH - Assignments query failed:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] FRESH APPROACH - No assignments found');
        return [];
      }

      console.log('[OptimizedAssignmentService] FRESH APPROACH - Found assignments:', assignments.length);

      // FRESH APPROACH: Get ALL assignment-employee relationships in one query
      const assignmentIds = assignments.map(a => a.id);
      
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] FRESH APPROACH - Employee relationships fetch failed:', employeesError);
      }

      console.log('[OptimizedAssignmentService] FRESH APPROACH - Assignment-employee relationships:', assignmentEmployees?.length || 0);

      // FRESH APPROACH: Get ALL employee profiles in one query
      const employeeUserIds = assignmentEmployees?.map(ae => ae.user_id) || [];
      const uniqueEmployeeIds = [...new Set(employeeUserIds)];
      
      let employeeProfiles: any[] = [];
      if (uniqueEmployeeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueEmployeeIds);

        if (profilesError) {
          console.warn('[OptimizedAssignmentService] FRESH APPROACH - Employee profiles fetch failed:', profilesError);
        } else {
          employeeProfiles = profiles || [];
          console.log('[OptimizedAssignmentService] FRESH APPROACH - Employee profiles loaded:', employeeProfiles.length);
        }
      }

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
          console.warn('[OptimizedAssignmentService] FRESH APPROACH - Responsible users fetch failed:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // FRESH APPROACH: Process assignments and ensure ALL employee names are preserved
      const result = assignments.map(assignment => {
        // Get employee relationships for this specific assignment
        const assignmentEmployeeRelations = assignmentEmployees?.filter(
          ae => ae.assignment_id === assignment.id
        ) || [];

        console.log(`[OptimizedAssignmentService] FRESH APPROACH - Assignment "${assignment.title}" has ${assignmentEmployeeRelations.length} employee relations`);

        // Map employee relations to full employee data
        const employees: AssignmentEmployee[] = assignmentEmployeeRelations
          .map(relation => {
            const profile = employeeProfiles.find(p => p.id === relation.user_id);
            if (profile) {
              console.log(`[OptimizedAssignmentService] FRESH APPROACH - Found employee profile: ${profile.name} for assignment ${assignment.title}`);
              return {
                id: profile.id,
                name: profile.name,
                email: profile.email
              };
            } else {
              console.warn(`[OptimizedAssignmentService] FRESH APPROACH - No profile found for user_id: ${relation.user_id}`);
              return null;
            }
          })
          .filter(emp => emp !== null) as AssignmentEmployee[];

        // Get responsible user
        const responsibleUser = assignment.responsible_user_id 
          ? responsibleUsers.find(user => user.id === assignment.responsible_user_id)
          : null;

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
          cars: [],
          responsible_user: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name,
            email: responsibleUser.email
          } : undefined
        };

        // Debug logging for employee preservation
        const employeeNames = employees.map(e => e.name);
        console.log(`[OptimizedAssignmentService] FRESH APPROACH - Assignment "${assignment.title}" final employees:`, employeeNames);

        return processedAssignment;
      });

      console.log('[OptimizedAssignmentService] FRESH APPROACH - Processing complete:', {
        totalAssignments: result.length,
        filter,
        userRole,
        context: filter === 'user' ? 'DASHBOARD' : filter === 'published' ? 'PLANNER_SERVICEMEDARBEJDER' : 'PLANNER_ADMIN'
      });

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] FRESH APPROACH - Critical error:', err);
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
