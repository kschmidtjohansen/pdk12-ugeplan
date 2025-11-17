import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';

export class PlannerChangeLogger {
  /**
   * Get current user's name from profile
   */
  private static async getCurrentUserName(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Unknown';
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
        
      return profile?.name || user.email || 'Unknown';
    } catch (error) {
      console.error('[PlannerChangeLogger] Failed to get user name:', error);
      return 'Unknown';
    }
  }

  /**
   * Log assignment creation
   */
  static async logCreate(assignmentId: string, assignmentData: Partial<Assignment>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userName = await this.getCurrentUserName();

      const changeDetails = {
        operation: 'CREATE',
        title: assignmentData.title,
        date: assignmentData.date,
        location: assignmentData.location,
        case_number: assignmentData.case_number,
        from_time: assignmentData.fromTime,
        to_time: assignmentData.toTime,
        employees: assignmentData.employees?.length || 0,
        cars: assignmentData.cars?.length || 0
      };

      await supabase
        .from('planner_change_log')
        .insert({
          assignment_id: assignmentId,
          operation: 'CREATE',
          changed_by: user.id,
          changed_by_name: userName,
          change_details: changeDetails
        });

      console.log('[PlannerChangeLogger] Logged CREATE operation', { assignmentId, userName });
    } catch (error) {
      console.error('[PlannerChangeLogger] Failed to log CREATE:', error);
    }
  }

  /**
   * Log assignment update
   */
  static async logUpdate(
    assignmentId: string, 
    before: Partial<Assignment>, 
    after: Partial<Assignment>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userName = await this.getCurrentUserName();

      // Identify changed fields
      const changes: Record<string, any> = {};
      const fields = ['title', 'date', 'location', 'fromTime', 'toTime', 'description', 'type'];
      
      fields.forEach(field => {
        if (before[field as keyof Assignment] !== after[field as keyof Assignment]) {
          changes[field] = {
            from: before[field as keyof Assignment],
            to: after[field as keyof Assignment]
          };
        }
      });

      // Check employee changes
      const beforeEmployees = before.employees || [];
      const afterEmployees = after.employees || [];
      if (JSON.stringify(beforeEmployees) !== JSON.stringify(afterEmployees)) {
        changes.employees = {
          from: beforeEmployees.length,
          to: afterEmployees.length
        };
      }

      // Check car changes
      const beforeCars = before.cars || [];
      const afterCars = after.cars || [];
      if (JSON.stringify(beforeCars) !== JSON.stringify(afterCars)) {
        changes.cars = {
          from: beforeCars.length,
          to: afterCars.length
        };
      }

      if (Object.keys(changes).length === 0) {
        console.log('[PlannerChangeLogger] No changes detected, skipping log');
        return;
      }

      const changeDetails = {
        operation: 'UPDATE',
        title: after.title || before.title,
        case_number: after.case_number || before.case_number,
        changes
      };

      await supabase
        .from('planner_change_log')
        .insert({
          assignment_id: assignmentId,
          operation: 'UPDATE',
          changed_by: user.id,
          changed_by_name: userName,
          change_details: changeDetails
        });

      console.log('[PlannerChangeLogger] Logged UPDATE operation', { assignmentId, changes });
    } catch (error) {
      console.error('[PlannerChangeLogger] Failed to log UPDATE:', error);
    }
  }

  /**
   * Log assignment deletion
   */
  static async logDelete(assignmentId: string, assignmentData: Partial<Assignment>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userName = await this.getCurrentUserName();

      const changeDetails = {
        operation: 'DELETE',
        title: assignmentData.title,
        date: assignmentData.date,
        location: assignmentData.location,
        case_number: assignmentData.case_number
      };

      await supabase
        .from('planner_change_log')
        .insert({
          assignment_id: assignmentId,
          operation: 'DELETE',
          changed_by: user.id,
          changed_by_name: userName,
          change_details: changeDetails
        });

      console.log('[PlannerChangeLogger] Logged DELETE operation', { assignmentId, userName });
    } catch (error) {
      console.error('[PlannerChangeLogger] Failed to log DELETE:', error);
    }
  }

  /**
   * Log bulk publish operation
   */
  static async logPublish(assignmentIds: string[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userName = await this.getCurrentUserName();

      // Log a single PUBLISH entry for bulk operations
      const changeDetails = {
        operation: 'PUBLISH',
        count: assignmentIds.length,
        assignment_ids: assignmentIds
      };

      // Insert one log entry per assignment published
      const logs = assignmentIds.map(id => ({
        assignment_id: id,
        operation: 'PUBLISH',
        changed_by: user.id,
        changed_by_name: userName,
        change_details: changeDetails
      }));

      await supabase
        .from('planner_change_log')
        .insert(logs);

      console.log('[PlannerChangeLogger] Logged PUBLISH operation', { count: assignmentIds.length });
    } catch (error) {
      console.error('[PlannerChangeLogger] Failed to log PUBLISH:', error);
    }
  }
}
