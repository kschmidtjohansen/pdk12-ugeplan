
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
    console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Starting fetch with:', { filter, userId, userRole });

    try {
      // Step 1: Build base assignments query with simple, reliable structure
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
        `);

      // Step 2: Apply context-specific filtering
      if (filter === 'user' && userId) {
        // DASHBOARD CONTEXT: User's assignments only, but preserve ALL colleague names
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Dashboard: filtering for user assignments');
        
        // Get assignment IDs where user is assigned
        const { data: userAssignmentIds } = await supabase
          .from('assignments_employees')
          .select('assignment_id')
          .eq('user_id', userId);
        
        const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
        
        if (assignmentIds.length > 0) {
          // Show assignments where user is assigned OR responsible
          assignmentsQuery = assignmentsQuery.or(`id.in.(${assignmentIds.join(',')}),responsible_user_id.eq.${userId}`);
        } else {
          // Only show assignments where user is responsible
          assignmentsQuery = assignmentsQuery.eq('responsible_user_id', userId);
        }
        
        // Always filter to published for dashboard
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'all') {
        // PLANNER CONTEXT: Role-based visibility
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Planner: applying role-based filtering');
        
        if (userRole === 'servicemedarbejder') {
          // CRITICAL FIX: Servicemedarbejder sees ALL published assignments in planner
          assignmentsQuery = assignmentsQuery.eq('published', true);
          console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Servicemedarbejder: showing ALL published assignments');
        } else {
          // Admin/skadeleder can see everything in planner
          console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Admin/Skadeleder: showing all assignments');
        }
        
      } else if (filter === 'published') {
        assignmentsQuery = assignmentsQuery.eq('published', true);
      } else if (filter === 'unpublished') {
        assignmentsQuery = assignmentsQuery.eq('published', false);
      }

      // Step 3: Execute the assignments query
      const { data: assignments, error: assignmentsError } = await assignmentsQuery
        .order('assignment_date', { ascending: true });

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] COMPREHENSIVE FIX - Assignments query failed:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - No assignments found');
        return [];
      }

      console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Found assignments:', assignments.length);

      const assignmentIds = assignments.map(a => a.id);

      // Step 4: Fetch ALL assignment-employee relationships (separate query)
      console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Fetching assignment-employee relationships...');
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] COMPREHENSIVE FIX - Employee relationships fetch failed:', employeesError);
      }

      // Step 5: Fetch ALL employee profiles (separate query)
      const employeeUserIds = assignmentEmployees?.map(ae => ae.user_id) || [];
      const uniqueEmployeeIds = [...new Set(employeeUserIds)];
      
      let employeeProfiles: any[] = [];
      if (uniqueEmployeeIds.length > 0) {
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Fetching employee profiles for IDs:', uniqueEmployeeIds.length);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueEmployeeIds);

        if (profilesError) {
          console.warn('[OptimizedAssignmentService] COMPREHENSIVE FIX - Employee profiles fetch failed:', profilesError);
        } else {
          employeeProfiles = profiles || [];
        }
      }

      // Step 6: Fetch responsible users (separate query)
      const responsibleUserIds = assignments
        .map(a => a.responsible_user_id)
        .filter(id => id !== null);

      let responsibleUsers: any[] = [];
      if (responsibleUserIds.length > 0) {
        console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Fetching responsible users for IDs:', responsibleUserIds.length);
        const { data: respUsers, error: respError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', responsibleUserIds);

        if (respError) {
          console.warn('[OptimizedAssignmentService] COMPREHENSIVE FIX - Responsible users fetch failed:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // Step 7: Process and combine all data
      const result = assignments.map(assignment => {
        // Get ALL employees for this assignment (CRITICAL: preserve all names)
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
          employees: employees, // CRITICAL: All employee names preserved
          cars: [], // Simplified for now, focusing on core issue
          responsible_user: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name,
            email: responsibleUser.email
          } : undefined
        };

        // Log assignment details for debugging
        const employeeNames = employees.map(e => e.name);
        console.log(`[OptimizedAssignmentService] COMPREHENSIVE FIX - Processed assignment ${assignment.title}:`, {
          id: assignment.id,
          employees: employeeNames,
          published: assignment.published,
          assignmentDate: assignment.assignment_date
        });

        return processedAssignment;
      });

      console.log('[OptimizedAssignmentService] COMPREHENSIVE FIX - Final results:', {
        totalAssignments: result.length,
        filter,
        userRole,
        sampleEmployeeCounts: result.slice(0, 3).map(a => ({ title: a.title, employeeCount: a.employees.length }))
      });

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] COMPREHENSIVE FIX - Critical error:', err);
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
