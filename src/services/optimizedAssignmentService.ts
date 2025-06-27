
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

      if (error) throw error;

      const result = this.transformAssignmentData(data || []);
      console.log('[OptimizedAssignmentService] fetchAllAssignments result:', JSON.stringify(result.slice(0, 3), null, 2));
      return result;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
      return [];
    }
  }

  static async fetchUserAssignments(userId: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
      // CRITICAL FIX: Two-step approach to get user assignments with ALL employee info
      // Step 1: Get assignment IDs where user is assigned
      const { data: userAssignmentIds, error: idsError } = await supabase
        .from('assignments_employees')
        .select('assignment_id')
        .eq('user_id', userId);

      if (idsError) throw idsError;

      const assignmentIds = userAssignmentIds?.map(ae => ae.assignment_id) || [];
      
      if (assignmentIds.length === 0) {
        console.log('[OptimizedAssignmentService] fetchUserAssignments - No assignments found for user');
        return [];
      }

      // Step 2: Get full assignment data with ALL employees for those assignments
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

      if (error) throw error;

      const result = this.transformAssignmentData(data || []);
      console.log('[OptimizedAssignmentService] API payload for MineOpgaver:', JSON.stringify(result.slice(0, 3), null, 2));
      return result;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching user assignments:', error);
      return [];
    }
  }

  static async fetchPublishedAssignments(userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
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

      if (error) throw error;

      const result = this.transformAssignmentData(data || []);
      console.log('[OptimizedAssignmentService] fetchPublishedAssignments - ALL published assignments:', JSON.stringify(result.slice(0, 3), null, 2));
      return result;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching published assignments:', error);
      return [];
    }
  }

  static async fetchUnpublishedAssignments(userId?: string, userRole?: string): Promise<OptimizedAssignmentData[]> {
    try {
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

      if (error) throw error;

      return this.transformAssignmentData(data || []);
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching unpublished assignments:', error);
      return [];
    }
  }

  private static transformAssignmentData(data: any[]): OptimizedAssignmentData[] {
    return data.map(assignment => {
      // CRITICAL FIX: Preserve ALL employee information
      const employees = assignment.assignments_employees?.map((ae: any) => ({
        id: ae.profiles?.id || '',
        name: ae.profiles?.name || 'Unknown'
      })) || [];

      console.log(`[OptimizedAssignmentService] Transform assignment "${assignment.title}":`, {
        rawEmployees: assignment.assignments_employees,
        transformedEmployees: employees,
        employeeCount: employees.length
      });

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
