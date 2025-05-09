
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

// Basic CRUD operations for assignments
export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchAssignments();

    // Set up real-time subscription for assignment updates
    const assignmentSubscription = supabase
      .channel('public:assignments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments' }, 
        fetchAssignments
      )
      .subscribe();

    // Set up real-time subscription for assignment employee changes
    const assignmentEmployeesSubscription = supabase
      .channel('public:assignment_employees')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignment_employees' }, 
        fetchAssignments
      )
      .subscribe();

    return () => {
      assignmentSubscription.unsubscribe();
      assignmentEmployeesSubscription.unsubscribe();
    };
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      // First get all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Then get all assignment employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('assignment_employees')
        .select('*');

      if (employeesError) {
        throw employeesError;
      }

      // Map employees to assignments
      const assignmentsWithEmployees = assignmentsData.map(assignment => {
        const assignmentEmployees = employeesData
          .filter(ae => ae.assignment_id === assignment.id)
          .map(ae => ae.employee_name);

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location || '',
          car: assignment.car_name || '',
          published: assignment.published || false,
          employees: assignmentEmployees
        } as Assignment;
      });

      setAssignments(assignmentsWithEmployees);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: t("common.error"),
        description: t("planner.fetchError"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (assignment: Assignment) => {
    try {
      // First create the assignment
      const { data: newAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: assignment.title,
          description: assignment.description,
          date: assignment.date,
          from_time: assignment.fromTime,
          to_time: assignment.toTime,
          location: assignment.location,
          car_name: assignment.car,
          published: assignment.published || false
        })
        .select()
        .single();

      if (assignmentError) {
        throw assignmentError;
      }

      // Then add the employees
      if (assignment.employees && assignment.employees.length > 0) {
        const employeeRecords = assignment.employees.map(empName => ({
          assignment_id: newAssignment.id,
          employee_name: empName,
          // We don't have direct mapping of names to IDs here
          // In a real app, we would need to lookup or pass employee IDs 
          employee_id: '00000000-0000-0000-0000-000000000000'
        }));

        const { error: employeesError } = await supabase
          .from('assignment_employees')
          .insert(employeeRecords);

        if (employeesError) {
          throw employeesError;
        }
      }

      toast({
        title: t("planner.assignmentCreated"),
        description: t("planner.assignmentCreatedMsg", { title: assignment.title }),
      });
      
      fetchAssignments();
      return assignment;
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: t("common.error"),
        description: t("planner.createError"),
        variant: "destructive"
      });
      return assignment;
    }
  };

  const updateAssignment = async (updatedAssignment: Assignment) => {
    try {
      // First update the assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({
          title: updatedAssignment.title,
          description: updatedAssignment.description,
          date: updatedAssignment.date,
          from_time: updatedAssignment.fromTime,
          to_time: updatedAssignment.toTime,
          location: updatedAssignment.location,
          car_name: updatedAssignment.car,
          published: updatedAssignment.published
        })
        .eq('id', updatedAssignment.id);

      if (assignmentError) {
        throw assignmentError;
      }

      // Delete existing employee assignments
      const { error: deleteError } = await supabase
        .from('assignment_employees')
        .delete()
        .eq('assignment_id', updatedAssignment.id);

      if (deleteError) {
        throw deleteError;
      }

      // Add updated employee assignments
      if (updatedAssignment.employees && updatedAssignment.employees.length > 0) {
        const employeeRecords = updatedAssignment.employees.map(empName => ({
          assignment_id: updatedAssignment.id,
          employee_name: empName,
          // We don't have direct mapping of names to IDs here
          employee_id: '00000000-0000-0000-0000-000000000000'
        }));

        const { error: employeesError } = await supabase
          .from('assignment_employees')
          .insert(employeeRecords);

        if (employeesError) {
          throw employeesError;
        }
      }

      toast({
        title: t("planner.assignmentUpdated"),
        description: t("planner.assignmentUpdatedMsg", { title: updatedAssignment.title }),
      });
      
      fetchAssignments();
      return updatedAssignment;
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: t("common.error"),
        description: t("planner.updateError"),
        variant: "destructive"
      });
      return updatedAssignment;
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      // Delete the assignment (will cascade to assignment_employees)
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        throw error;
      }

      toast({
        title: t("planner.assignmentDeleted"),
        description: t("planner.assignmentDeletedMsg"),
      });
      
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: t("common.error"),
        description: t("planner.deleteError"),
        variant: "destructive"
      });
    }
  };

  return {
    assignments,
    isLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    fetchAssignments
  };
};
