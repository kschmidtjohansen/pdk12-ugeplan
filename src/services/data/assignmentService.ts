
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';

export class AssignmentService {
  static async fetchAllPublishedAssignments(): Promise<Assignment[]> {
    const { data: assignmentsData, error } = await supabase
      .from('assignments')
      .select(`
        id, title, description, assignment_date, from_time, to_time,
        location, car_id, car_ids, published, responsible_user_id,
        created_at, updated_at
      `)
      .eq('published', true)
      .order('assignment_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return this.transformAssignments(assignmentsData || []);
  }

  static async fetchUserAssignments(userId: string): Promise<Assignment[]> {
    const { data: userAssignments, error: userError } = await supabase
      .from('assignments_employees')
      .select('assignment_id')
      .eq('user_id', userId);

    if (userError) {
      throw new Error(`Failed to fetch user assignments: ${userError.message}`);
    }

    if (!userAssignments || userAssignments.length === 0) {
      return [];
    }

    const assignmentIds = userAssignments.map(ua => ua.assignment_id);

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id, title, description, assignment_date, from_time, to_time,
        location, car_id, car_ids, published, responsible_user_id,
        created_at, updated_at
      `)
      .in('id', assignmentIds)
      .eq('published', true)
      .order('assignment_date', { ascending: true });

    if (assignmentsError) {
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    return this.transformAssignments(assignmentsData || []);
  }

  private static async transformAssignments(assignmentsData: any[]): Promise<Assignment[]> {
    const assignmentIds = assignmentsData.map(a => a.id);
    let employeeAssignments: any[] = [];
    let profilesData: any[] = [];

    if (assignmentIds.length > 0) {
      const { data: empData } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);
      
      employeeAssignments = empData || [];

      if (employeeAssignments.length > 0) {
        const userIds = [...new Set(employeeAssignments.map(ae => ae.user_id))];
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        
        profilesData = profData || [];
      }
    }

    return assignmentsData.map(assignment => {
      const assignmentEmployees = employeeAssignments.filter(ae => ae.assignment_id === assignment.id);
      const employees = assignmentEmployees
        .map(ae => {
          const profile = profilesData.find(p => p.id === ae.user_id);
          return profile?.name;
        })
        .filter(Boolean);

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        date: assignment.assignment_date,
        fromTime: assignment.from_time,
        toTime: assignment.to_time,
        location: assignment.location,
        type: 'other' as const,
        published: assignment.published,
        responsibleUserId: assignment.responsible_user_id || '',
        employees: employees,
        car: assignment.car_id || '',
        cars: assignment.car_ids || [],
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        responsibleUser: null
      };
    });
  }
}
