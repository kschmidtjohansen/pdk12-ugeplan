
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage synchronization between employee leave status and vacations
 */
export const useEmployeeVacationSync = (refreshEmployees: () => Promise<void>) => {
  /**
   * Update employee leave status based on active vacations
   */
  const updateEmployeeLeaveStatusFromVacations = async () => {
    try {
      console.log('Updating employee leave status from vacations...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      
      // 1. Find employees who are currently on approved vacation
      const { data: activeVacations, error: vacationError } = await supabase
        .from('vacations')
        .select('user_id')
        .eq('status', 'approved')
        .lte('start_date', todayISO)
        .gte('end_date', todayISO);
      
      if (vacationError) {
        console.error('Error fetching active vacations:', vacationError);
        return false;
      }
      
      // Create a set of user IDs who are on active vacations
      const employeesOnVacation = new Set(
        activeVacations?.map(vacation => vacation.user_id) || []
      );
      
      console.log(`Found ${employeesOnVacation.size} employees on active vacation`);
      
      // 2. Find all employees and update their status if necessary
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, on_leave');
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return false;
      }
      
      // Track employees who need to be marked as on leave or available
      const employeesToMarkOnLeave: string[] = [];
      const employeesToMarkAvailable: string[] = [];
      
      // Process each employee
      for (const employee of employees || []) {
        const isOnVacation = employeesOnVacation.has(employee.id);
        
        // If employee is on vacation but not marked as on leave, mark them on leave
        if (isOnVacation && !employee.on_leave) {
          employeesToMarkOnLeave.push(employee.id);
        }
        
        // If employee is not on vacation but is marked as on leave due to vacation 
        // (we'll need to check if they were marked as on leave due to a vacation)
        if (!isOnVacation && employee.on_leave) {
          // Check if they were marked as on leave due to a vacation that has ended
          const { data: recentVacations, error: recentError } = await supabase
            .from('vacations')
            .select('id')
            .eq('user_id', employee.id)
            .eq('status', 'approved')
            .lt('end_date', todayISO)
            .order('end_date', { ascending: false })
            .limit(1);
          
          if (recentError) {
            console.error(`Error checking recent vacations for employee ${employee.id}:`, recentError);
            continue;
          }
          
          // If there was a recent vacation that has ended, mark them as available
          if (recentVacations && recentVacations.length > 0) {
            employeesToMarkAvailable.push(employee.id);
          }
        }
      }
      
      console.log(`Marking ${employeesToMarkOnLeave.length} employees as on leave`);
      console.log(`Marking ${employeesToMarkAvailable.length} employees as available`);
      
      // Update employees who need to be marked as on leave
      if (employeesToMarkOnLeave.length > 0) {
        const { error: markOnLeaveError } = await supabase
          .from('profiles')
          .update({ on_leave: true })
          .in('id', employeesToMarkOnLeave);
        
        if (markOnLeaveError) {
          console.error('Error marking employees as on leave:', markOnLeaveError);
        }
      }
      
      // Update employees who need to be marked as available
      if (employeesToMarkAvailable.length > 0) {
        const { error: markAvailableError } = await supabase
          .from('profiles')
          .update({ on_leave: false })
          .in('id', employeesToMarkAvailable);
        
        if (markAvailableError) {
          console.error('Error marking employees as available:', markAvailableError);
        }
      }
      
      // If any updates were made, refresh the employee list
      if (employeesToMarkOnLeave.length > 0 || employeesToMarkAvailable.length > 0) {
        await refreshEmployees();
      }
      
      return true;
    } catch (err) {
      console.error('Error updating employee leave status from vacations:', err);
      return false;
    }
  };

  return {
    updateEmployeeLeaveStatusFromVacations
  };
};
