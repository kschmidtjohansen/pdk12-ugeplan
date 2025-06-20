
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';

export class SimpleAssignmentService {
  static async fetchAllPublishedAssignments(): Promise<Assignment[]> {
    try {
      console.log('[SimpleAssignmentService] Fetching all published assignments with simple query');
      
      // Simple query for published assignments
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[SimpleAssignmentService] Error fetching assignments:', error);
        throw error;
      }

      console.log('[SimpleAssignmentService] Found assignments:', assignments?.length || 0);

      if (!assignments) {
        return [];
      }

      // Get employee data for these assignments
      const assignmentIds = assignments.map(a => a.id);
      const employeeData = await this.fetchEmployeeDataForAssignments(assignmentIds);

      // Transform to Assignment format
      const transformedAssignments: Assignment[] = assignments.map(assignment => {
        const employees = employeeData
          .filter(emp => emp.assignment_id === assignment.id)
          .map(emp => emp.name);

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: null,
          cars: [],
          employees: employees,
          published: assignment.published,
          responsibleUser: null
        };
      });

      console.log('[SimpleAssignmentService] Transformed assignments:', transformedAssignments.length);
      return transformedAssignments;

    } catch (error) {
      console.error('[SimpleAssignmentService] Critical error:', error);
      throw error;
    }
  }

  static async fetchUserAssignments(userId: string): Promise<Assignment[]> {
    try {
      console.log('[SimpleAssignmentService] Fetching user assignments for:', userId);
      
      // Get assignments where user is assigned
      const { data: userAssignmentIds } = await supabase
        .from('assignments_employees')
        .select('assignment_id')
        .eq('user_id', userId);

      const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
      
      if (assignmentIds.length === 0) {
        console.log('[SimpleAssignmentService] No assignments found for user');
        return [];
      }

      // Get the actual assignments
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .in('id', assignmentIds)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[SimpleAssignmentService] Error fetching user assignments:', error);
        throw error;
      }

      if (!assignments) {
        return [];
      }

      // Get employee data for these assignments
      const employeeData = await this.fetchEmployeeDataForAssignments(assignmentIds);

      // Transform to Assignment format
      const transformedAssignments: Assignment[] = assignments.map(assignment => {
        const employees = employeeData
          .filter(emp => emp.assignment_id === assignment.id)
          .map(emp => emp.name);

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: null,
          cars: [],
          employees: employees,
          published: assignment.published,
          responsibleUser: null
        };
      });

      console.log('[SimpleAssignmentService] User assignments transformed:', transformedAssignments.length);
      return transformedAssignments;

    } catch (error) {
      console.error('[SimpleAssignmentService] Error fetching user assignments:', error);
      throw error;
    }
  }

  private static async fetchEmployeeDataForAssignments(assignmentIds: string[]) {
    if (assignmentIds.length === 0) {
      return [];
    }

    try {
      // Get assignment-employee relationships
      const { data: assignmentEmployees } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (!assignmentEmployees || assignmentEmployees.length === 0) {
        return [];
      }

      // Get user profiles
      const userIds = [...new Set(assignmentEmployees.map(ae => ae.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (!profiles) {
        return [];
      }

      // Combine the data
      return assignmentEmployees.map(ae => ({
        assignment_id: ae.assignment_id,
        user_id: ae.user_id,
        name: profiles.find(p => p.id === ae.user_id)?.name || 'Unknown'
      }));

    } catch (error) {
      console.error('[SimpleAssignmentService] Error fetching employee data:', error);
      return [];
    }
  }
}
