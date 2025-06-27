
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedAssignmentData {
  id: string;
  title: string;
  description: string | null;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  type: string;
  published: boolean;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
  employees: Array<{ id: string; name: string }>;
  cars: Array<{ id: string; name: string; car_number: string }>;
  responsible_user: { id: string; name: string } | null;
}

export class OptimizedAssignmentService {
  static async fetchAllAssignments(userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Fetching all assignments for role:', userRole);
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
        throw error;
      }

      const result = this.transformAssignmentData(data || []);
      console.log('[OptimizedAssignmentService] Fetched', result.length, 'assignments');
      return result;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error in fetchAllAssignments:', error);
      return [];
    }
  }

  static async fetchUserAssignments(userId: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Fetching user assignments for:', userId, 'role:', userRole);
      
      // Get assignment IDs where user is assigned
      const { data: userAssignmentIds, error: idsError } = await supabase
        .from('assignments_employees')
        .select('assignment_id')
        .eq('user_id', userId);

      if (idsError) {
        console.error('[OptimizedAssignmentService] Error fetching user assignment IDs:', idsError);
        throw idsError;
      }

      const assignmentIds = userAssignmentIds?.map(ae => ae.assignment_id) || [];
      
      if (assignmentIds.length === 0) {
        console.log('[OptimizedAssignmentService] No assignments found for user');
        return [];
      }

      // Get full assignment data with ALL employees for those assignments
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .in('id', assignmentIds)
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching user assignments:', error);
        throw error;
      }

      const result = this.transformAssignmentData(data || []);
      console.log('[OptimizedAssignmentService] Fetched', result.length, 'user assignments');
      return result;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error in fetchUserAssignments:', error);
      return [];
    }
  }

  static async fetchPublishedAssignments(userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Fetching published assignments');
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .eq('published', true)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching published assignments:', error);
        throw error;
      }

      const result = this.transformAssignmentData(data || []);
      console.log('[OptimizedAssignmentService] Fetched', result.length, 'published assignments');
      return result;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error in fetchPublishedAssignments:', error);
      return [];
    }
  }

  static async fetchUnpublishedAssignments(userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Fetching unpublished assignments');
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          assignments_employees(
            profiles(id, name)
          ),
          cars(id, name, car_number),
          responsible_user:profiles!assignments_responsible_user_id_fkey(id, name)
        `)
        .eq('published', false)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('[OptimizedAssignmentService] Error fetching unpublished assignments:', error);
        throw error;
      }

      return this.transformAssignmentData(data || []);
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error in fetchUnpublishedAssignments:', error);
      return [];
    }
  }

  private static transformAssignmentData(data: any[]): OptimizedAssignmentData[] {
    return data.map(assignment => {
      // Preserve ALL employee information
      const employees = assignment.assignments_employees?.map((ae: any) => ({
        id: ae.profiles?.id || '',
        name: ae.profiles?.name || 'Unknown'
      })) || [];

      console.log(`[OptimizedAssignmentService] Transformed assignment "${assignment.title}" with ${employees.length} employees:`, 
        employees.map(e => e.name));

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        assignment_date: assignment.assignment_date,
        from_time: assignment.from_time,
        to_time: assignment.to_time,
        location: assignment.location,
        type: assignment.type || 'other',
        published: assignment.published,
        responsible_user_id: assignment.responsible_user_id,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        employees: employees,
        cars: assignment.cars || [],
        responsible_user: assignment.responsible_user
      };
    });
  }
}
