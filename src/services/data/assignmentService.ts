
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';
import { DemoUserService } from '@/services/demoUserService';

export class AssignmentService {
  private static getDemoUserService() {
    return DemoUserService.getInstance();
  }

  static async fetchAllPublishedAssignments(currentUserEmail?: string): Promise<Assignment[]> {
    const { data: assignmentsData, error } = await supabase
      .from('assignments')
      .select(`
        id, title, description, assignment_date, from_time, to_time,
        location, car_id, car_ids, published, responsible_user_id,
        attachment_files, created_at, updated_at
      `)
      .eq('published', true)
      .order('assignment_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return this.transformAssignments(assignmentsData || [], currentUserEmail);
  }

  static async fetchUserAssignments(userId: string, currentUserEmail?: string): Promise<Assignment[]> {
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
        attachment_files, created_at, updated_at
      `)
      .in('id', assignmentIds)
      .eq('published', true)
      .order('assignment_date', { ascending: true });

    if (assignmentsError) {
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    return this.transformAssignments(assignmentsData || [], currentUserEmail);
  }

  private static async transformAssignments(assignmentsData: any[], currentUserEmail?: string): Promise<Assignment[]> {
    const demoService = this.getDemoUserService();
    const isCurrentUserDemo = currentUserEmail ? demoService.isDemoUser(currentUserEmail) : false;
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
          .select('id, name, email')
          .in('id', userIds);
        
        profilesData = profData || [];
      }
    }

    // Filter out assignments created by demo user if current user is not demo user
    let filteredAssignments = assignmentsData;
    if (!isCurrentUserDemo && assignmentsData.length > 0) {
      // Get responsible user emails to filter out demo user assignments
      const responsibleUserIds = [...new Set(assignmentsData
        .map(a => a.responsible_user_id)
        .filter(Boolean))];
      
      if (responsibleUserIds.length > 0) {
        const { data: responsibleProfiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', responsibleUserIds);
        
        const responsibleProfilesData = responsibleProfiles || [];
        filteredAssignments = assignmentsData.filter(assignment => {
          if (!assignment.responsible_user_id) return true;
          const responsibleProfile = responsibleProfilesData.find(p => p.id === assignment.responsible_user_id);
          return !responsibleProfile || !demoService.isDemoUser(responsibleProfile.email);
        });
      }
    }

    return filteredAssignments.map(assignment => {
      const assignmentEmployees = employeeAssignments.filter(ae => ae.assignment_id === assignment.id);
      // Filter employees to exclude demo user for non-demo users
      let employees = assignmentEmployees
        .map(ae => {
          const profile = profilesData.find(p => p.id === ae.user_id);
          return profile;
        })
        .filter(Boolean);
      
      if (!isCurrentUserDemo) {
        employees = employees.filter(profile => !demoService.isDemoUser(profile.email));
      }
      
      const employeeNames = employees.map(profile => profile.name);

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
        employees: employeeNames,
        car: assignment.car_id || '',
        cars: assignment.car_ids || [],
        attachments: assignment.attachment_files || [],
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        responsibleUser: null
      };
    });
  }
}
