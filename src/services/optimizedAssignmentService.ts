
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
    console.log('[OptimizedAssignmentService] DEFINITIVE FIX - Starting fetch with:', { filter, userId, userRole });

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

      // DEFINITIVE FIX: Clear and separate filter logic
      if (filter === 'user' && userId) {
        // DASHBOARD: Get assignments where user is assigned OR responsible
        // This will show ALL employees for these assignments (preserving colleague names)
        console.log('[OptimizedAssignmentService] DEFINITIVE FIX - Fetching user assignments for dashboard with ALL colleague names preserved');
        
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
        
        // Only show published assignments for user dashboard
        assignmentsQuery = assignmentsQuery.eq('published', true);
        
      } else if (filter === 'published') {
        // PLANNER: Show ALL published assignments for servicemedarbejder
        console.log('[OptimizedAssignmentService] DEFINITIVE FIX - Fetching ALL published assignments (no user filtering)');
        assignmentsQuery = assignmentsQuery.eq('published', true);
        // CRITICAL: NO user filtering - show everything published
        
      } else if (filter === 'all') {
        // PLANNER: Show ALL assignments for admin/skadeleder
        console.log('[OptimizedAssignmentService] DEFINITIVE FIX - Fetching ALL assignments for admin/skadeleder');
        // No additional filters
        
      } else if (filter === 'unpublished') {
        assignmentsQuery = assignmentsQuery.eq('published', false);
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        console.error('[OptimizedAssignmentService] DEFINITIVE FIX - Query error:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('[OptimizedAssignmentService] DEFINITIVE FIX - No assignments found for filter:', filter);
        return [];
      }

      console.log('[OptimizedAssignmentService] DEFINITIVE FIX - Retrieved assignments:', assignments.length);

      // DEFINITIVE FIX: Get ALL assignment-employee relationships for all retrieved assignments
      const assignmentIds = assignments.map(a => a.id);
      
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeesError) {
        console.warn('[OptimizedAssignmentService] DEFINITIVE FIX - Employee relationships error:', employeesError);
      }

      // DEFINITIVE FIX: Get ALL employee profiles for complete employee data
      const allEmployeeUserIds = assignmentEmployees?.map(ae => ae.user_id) || [];
      const uniqueEmployeeIds = [...new Set(allEmployeeUserIds)];
      
      let employeeProfiles: any[] = [];
      if (uniqueEmployeeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueEmployeeIds);

        if (profilesError) {
          console.warn('[OptimizedAssignmentService] DEFINITIVE FIX - Employee profiles error:', profilesError);
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
          console.warn('[OptimizedAssignmentService] DEFINITIVE FIX - Responsible users error:', respError);
        } else {
          responsibleUsers = respUsers || [];
        }
      }

      // DEFINITIVE FIX: Process assignments with complete employee information
      const result = assignments.map(assignment => {
        // Get ALL employees assigned to this specific assignment
        const assignmentEmployeeRelations = assignmentEmployees?.filter(
          ae => ae.assignment_id === assignment.id
        ) || [];

        // CRITICAL: Build complete employee list for this assignment
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

        // Special logging for Asbestkursus assignments
        if (assignment.title.toLowerCase().includes('asbestkursus')) {
          console.log(`[OptimizedAssignmentService] DEFINITIVE FIX - 🎯 ASBESTKURSUS PROCESSING:`, {
            title: assignment.title,
            date: assignment.assignment_date,
            totalEmployees: employees.length,
            employeeNames: employees.map(e => e.name),
            filter: filter,
            userId: userId,
            assignmentId: assignment.id
          });
        }

        console.log(`[OptimizedAssignmentService] DEFINITIVE FIX - Assignment "${assignment.title}" (${assignment.assignment_date}) employees:`, employees.map(e => e.name));

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
          employees: employees, // ALL employees preserved for all filter types
          cars: [],
          responsible_user: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name,
            email: responsibleUser.email
          } : undefined
        };
      });

      console.log('[OptimizedAssignmentService] DEFINITIVE FIX - Final result summary:', {
        filter,
        userRole,
        totalAssignments: result.length,
        asbestAssignments: result.filter(a => a.title.toLowerCase().includes('asbestkursus')).length,
        sampleEmployeeData: result.slice(0, 2).map(a => ({ 
          title: a.title, 
          date: a.assignment_date,
          employees: a.employees.map(e => e.name) 
        }))
      });

      return result;

    } catch (err) {
      console.error('[OptimizedAssignmentService] DEFINITIVE FIX - Critical error:', err);
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
