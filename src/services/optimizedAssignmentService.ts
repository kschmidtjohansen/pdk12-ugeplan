
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
    console.log('[OptimizedAssignmentService] FIXED ROOT CAUSE - Starting fetch with:', { filter, userId, userRole });

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

      // FIXED ROOT CAUSE: Completely separate filter logic
      if (filter === 'user' && userId) {
        // DASHBOARD: Get assignments where user is assigned OR responsible - only published
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
        
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'published') {
        // PLANNER FIX: For servicemedarbejder - Show ALL published assignments (no user filtering)
        console.log('[OptimizedAssignmentService] FIXED ROOT CAUSE - Fetching ALL published assignments for servicemedarbejder planner view');
        assignmentsQuery = assignmentsQuery.eq('published', true);
        // CRITICAL: No user-based filtering for published view
        
      } else if (filter === 'all') {
        // PLANNER: ALL assignments for admin/skadeleder
        console.log('[OptimizedAssignmentService] FIXED ROOT CAUSE - Fetching ALL assignments for admin/skadeleder');
        // No additional filter
        
      } else if (filter === 'unpublished') {
        assignmentsQuery = assignmentsQuery.eq('published', false);
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] FIXED ROOT CAUSE - Query failed:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] FIXED ROOT CAUSE - No assignments found');
        return [];
      }

      console.log('[OptimizedAssignmentService] FIXED ROOT CAUSE - Found assignments:', assignments.length);

      // FIXED ROOT CAUSE: Get ALL assignment-employee relationships for ALL retrieved assignments
      const assignmentIds = assignments.map(a => a.id);
      
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] FIXED ROOT CAUSE - Employee relationships failed:', employeesError);
      }

      // FIXED ROOT CAUSE: Get ALL employee profiles to preserve ALL names for ALL assignments
      const employeeUserIds = assignmentEmployees?.map(ae => ae.user_id) || [];
      const uniqueEmployeeIds = [...new Set(employeeUserIds)];
      
      let employeeProfiles: any[] = [];
      if (uniqueEmployeeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueEmployeeIds);

        if (profilesError) {
          console.warn('[OptimizedAssignmentService] FIXED ROOT CAUSE - Employee profiles failed:', profilesError);
        } else {
          employeeProfiles = profiles || [];
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
          console.warn('[OptimizedAssignmentService] FIXED ROOT CAUSE - Responsible users failed:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // FIXED ROOT CAUSE: Process assignments with ALL employee names preserved for ALL users
      const result = assignments.map(assignment => {
        const assignmentEmployeeRelations = assignmentEmployees?.filter(
          ae => ae.assignment_id === assignment.id
        ) || [];

        // CRITICAL FIX: Get ALL employees for this assignment regardless of requesting user or filter
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

        // FIXED ROOT CAUSE: Log employee details for debugging
        console.log(`[OptimizedAssignmentService] FIXED ROOT CAUSE - Assignment "${assignment.title}" has employees:`, employees.map(e => e.name));

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
          employees: employees, // FIXED ROOT CAUSE: ALL employees preserved for all scenarios
          cars: [],
          responsible_user: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name,
            email: responsibleUser.email
          } : undefined
        };

        return processedAssignment;
      });

      console.log('[OptimizedAssignmentService] FIXED ROOT CAUSE - Processing complete:', {
        totalAssignments: result.length,
        filter,
        userRole,
        sampleEmployeeData: result.slice(0, 3).map(a => ({ 
          title: a.title, 
          employees: a.employees.map(e => e.name) 
        }))
      });

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] FIXED ROOT CAUSE - Critical error:', err);
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
