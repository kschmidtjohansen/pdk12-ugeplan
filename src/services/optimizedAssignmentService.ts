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
    console.log('[OptimizedAssignmentService] FINAL FIX - Starting fetch with:', { filter, userId, userRole });

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

      // FINAL FIX: Clear, definitive filtering logic
      if (filter === 'user' && userId) {
        // DASHBOARD CONTEXT: User's assignments only
        console.log('[OptimizedAssignmentService] FINAL FIX - Dashboard: fetching user assignments for', userId);
        
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
        
        // Dashboard shows only published assignments
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'published') {
        // PLANNER CONTEXT: ALL published assignments - NO USER RESTRICTIONS
        console.log('[OptimizedAssignmentService] FINAL FIX - Planner: fetching ALL published assignments');
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'all') {
        // PLANNER CONTEXT: ALL assignments for admin/skadeleder
        console.log('[OptimizedAssignmentService] FINAL FIX - Planner: fetching ALL assignments');
        // No additional filter
        
      } else if (filter === 'unpublished') {
        assignmentsQuery = assignmentsQuery.eq('published', false);
      }

      // Execute assignments query
      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] FINAL FIX - Assignments query failed:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] FINAL FIX - No assignments found');
        return [];
      }

      console.log('[OptimizedAssignmentService] FINAL FIX - Found assignments:', assignments.length);

      // FINAL FIX: Fetch ALL assignment-employee relationships for found assignments
      const assignmentIds = assignments.map(a => a.id);
      
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] FINAL FIX - Employee relationships fetch failed:', employeesError);
      }

      console.log('[OptimizedAssignmentService] FINAL FIX - Assignment-employee relationships:', assignmentEmployees?.length || 0);

      // FINAL FIX: Fetch ALL employee profiles
      const employeeUserIds = assignmentEmployees?.map(ae => ae.user_id) || [];
      const uniqueEmployeeIds = [...new Set(employeeUserIds)];
      
      let employeeProfiles: any[] = [];
      if (uniqueEmployeeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueEmployeeIds);

        if (profilesError) {
          console.warn('[OptimizedAssignmentService] FINAL FIX - Employee profiles fetch failed:', profilesError);
        } else {
          employeeProfiles = profiles || [];
          console.log('[OptimizedAssignmentService] FINAL FIX - Employee profiles loaded:', employeeProfiles.length);
        }
      }

      // Fetch responsible user profiles
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
          console.warn('[OptimizedAssignmentService] FINAL FIX - Responsible users fetch failed:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // FINAL FIX: Process assignments and preserve ALL employee names
      const result = assignments.map(assignment => {
        // Get ALL employees for this assignment
        const assignmentEmployeeRelations = assignmentEmployees?.filter(
          ae => ae.assignment_id === assignment.id
        ) || [];

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

        // Debug logging
        const employeeNames = employees.map(e => e.name);
        console.log(`[OptimizedAssignmentService] FINAL FIX - Assignment "${assignment.title}" employees:`, employeeNames);

        return processedAssignment;
      });

      console.log('[OptimizedAssignmentService] FINAL FIX - Processing complete:', {
        totalAssignments: result.length,
        filter,
        userRole,
        context: filter === 'user' ? 'DASHBOARD' : filter === 'published' ? 'PLANNER_SERVICEMEDARBEJDER' : 'PLANNER_ADMIN'
      });

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] FINAL FIX - Critical error:', err);
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
