
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { useAssignmentHelpers } from './useAssignmentHelpers';
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentActions = (
  fetchAssignments: () => Promise<void>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getCarsIdByName, getEmployeeIdByName } = useAssignmentHelpers();
  
  const createAssignment = async (newAssignment: Assignment) => {
    try {
      // First create the assignment record
      const { data, error } = await supabase
        .from('assignments')
        .insert([{
          title: newAssignment.title,
          description: newAssignment.description,
          assignment_date: newAssignment.date, // Map from date to assignment_date
          from_time: newAssignment.fromTime, // Map from fromTime to from_time
          to_time: newAssignment.toTime, // Map from toTime to to_time
          location: newAssignment.location,
          car_id: await getCarsIdByName(newAssignment.car), // Look up the car ID by name
          published: newAssignment.published || false
        }])
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from assignment creation');
      }
      
      const createdAssignment = data[0];
      
      // Now create employee assignments
      if (newAssignment.employees && newAssignment.employees.length > 0) {
        // Get the user IDs for the employee names
        const employeeIds = await Promise.all(
          newAssignment.employees.map(name => getEmployeeIdByName(name))
        );
        
        // Filter out any null IDs
        const validEmployeeIds = employeeIds.filter(Boolean) as string[];
        
        if (validEmployeeIds.length > 0) {
          // Create the employee assignment records
          const assignmentEmployees = validEmployeeIds.map(userId => ({
            assignment_id: createdAssignment.id,
            user_id: userId
          }));
          
          const { error: empError } = await supabase
            .from('assignments_employees')
            .insert(assignmentEmployees);
          
          if (empError) {
            console.error('Error assigning employees:', empError);
          }
        }
      }
      
      // Refresh the assignments
      fetchAssignments();
      
      toast({
        title: t("planner.assignmentCreated"),
        description: t("planner.assignmentCreatedMsg", { title: newAssignment.title }),
      });
      
      return {
        ...newAssignment,
        id: createdAssignment.id
      };
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error creating assignment',
        variant: 'destructive',
      });
      return newAssignment; // Return original for optimistic UI updates
    }
  };

  const updateAssignment = async (updatedAssignment: Assignment) => {
    try {
      // First update the assignment record
      const { error } = await supabase
        .from('assignments')
        .update({
          title: updatedAssignment.title,
          description: updatedAssignment.description,
          assignment_date: updatedAssignment.date, // Map from date to assignment_date
          from_time: updatedAssignment.fromTime, // Map from fromTime to from_time
          to_time: updatedAssignment.toTime, // Map from toTime to to_time
          location: updatedAssignment.location,
          car_id: await getCarsIdByName(updatedAssignment.car), // Look up the car ID by name
          published: updatedAssignment.published
        })
        .eq('id', updatedAssignment.id);
      
      if (error) throw error;
      
      // Update employee assignments - first delete existing
      const { error: delError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', updatedAssignment.id);
      
      if (delError) {
        console.error('Error deleting existing employee assignments:', delError);
      }
      
      // Now create new employee assignments
      if (updatedAssignment.employees && updatedAssignment.employees.length > 0) {
        // Get the user IDs for the employee names
        const employeeIds = await Promise.all(
          updatedAssignment.employees.map(name => getEmployeeIdByName(name))
        );
        
        // Filter out any null IDs
        const validEmployeeIds = employeeIds.filter(Boolean) as string[];
        
        if (validEmployeeIds.length > 0) {
          // Create the employee assignment records
          const assignmentEmployees = validEmployeeIds.map(userId => ({
            assignment_id: updatedAssignment.id,
            user_id: userId
          }));
          
          const { error: empError } = await supabase
            .from('assignments_employees')
            .insert(assignmentEmployees);
          
          if (empError) {
            console.error('Error assigning employees:', empError);
          }
        }
      }
      
      // Refresh the assignments
      fetchAssignments();
      
      toast({
        title: t("planner.assignmentUpdated"),
        description: t("planner.assignmentUpdatedMsg", { title: updatedAssignment.title }),
      });
      
      return updatedAssignment;
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating assignment',
        variant: 'destructive',
      });
      return updatedAssignment; // Return original for optimistic UI updates
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      // Delete employee assignments first (due to foreign key constraints)
      const { error: empError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (empError) {
        console.error('Error deleting employee assignments:', empError);
      }
      
      // Then delete the assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      // Update assignments through fetch
      fetchAssignments();
      
      toast({
        title: t("planner.assignmentDeleted"),
        description: t("planner.assignmentDeletedMsg"),
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting assignment',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
