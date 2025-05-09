
import { useState } from 'react';
import { Assignment } from '@/types/assignment';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAssignmentHelpers } from './useAssignmentHelpers';

export const useAssignmentActions = (fetchAssignments: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { getCarsIdByName, getEmployeeIdByName } = useAssignmentHelpers();

  // Create a new assignment
  const createAssignment = async (assignment: Partial<Assignment>, employees: string[]) => {
    try {
      // Get car ID if provided
      let carId = null;
      if (assignment.carName) {
        carId = await getCarsIdByName(assignment.carName);
      }
      
      // Insert into assignments table
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            title: assignment.title,
            description: assignment.description,
            location: assignment.location,
            assignment_date: assignment.date?.toISOString().split('T')[0],
            from_time: assignment.fromTime,
            to_time: assignment.toTime,
            car_id: carId,
            type: assignment.type,
            published: assignment.published || false
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0] && employees.length > 0) {
        const assignmentId = data[0].id;
        
        // Create employee assignments relationships
        const employeesEntries = [];
        
        for (const employeeName of employees) {
          const employeeId = await getEmployeeIdByName(employeeName);
          if (employeeId) {
            employeesEntries.push({
              assignment_id: assignmentId,
              user_id: employeeId
            });
          }
        }
        
        if (employeesEntries.length > 0) {
          const { error: assignmentError } = await supabase
            .from('assignments_employees')
            .insert(employeesEntries);
          
          if (assignmentError) throw assignmentError;
        }

        // Notify assigned employees
        if (assignment.published) {
          for (const employeeName of employees) {
            // Skip notifications for the current user
            const employeeId = await getEmployeeIdByName(employeeName);
            if (employeeId && employeeId !== user?.id) {
              addNotification({
                type: 'assignment',
                title: t("notifications.newAssignment"),
                message: t("notifications.assignedToJob", { 
                  job: assignment.title,
                  date: new Date(assignment.date || new Date()).toLocaleDateString()
                }),
                link: '/Ugeplan'
              });
            }
          }
        }
      }
      
      // Refresh assignments list
      await fetchAssignments();
      
      // Show success message
      toast({
        title: t("planner.assignmentCreated"),
        description: t("planner.assignmentCreatedDesc")
      });
      
      return true;
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error creating assignment',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Update an existing assignment
  const updateAssignment = async (assignment: Assignment, employees: string[]) => {
    try {
      // Get car ID if provided
      let carId = null;
      if (assignment.carName) {
        carId = await getCarsIdByName(assignment.carName);
      }
      
      // Update the assignment
      const { error } = await supabase
        .from('assignments')
        .update({
          title: assignment.title,
          description: assignment.description,
          location: assignment.location,
          assignment_date: assignment.date?.toISOString().split('T')[0],
          from_time: assignment.fromTime,
          to_time: assignment.toTime,
          car_id: carId,
          type: assignment.type,
          published: assignment.published || false
        })
        .eq('id', assignment.id);
      
      if (error) throw error;
      
      // Delete existing employee assignments
      const { error: deleteError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignment.id);
      
      if (deleteError) throw deleteError;
      
      // Create new employee assignments
      if (employees.length > 0) {
        const employeesEntries = [];
        
        for (const employeeName of employees) {
          const employeeId = await getEmployeeIdByName(employeeName);
          if (employeeId) {
            employeesEntries.push({
              assignment_id: assignment.id,
              user_id: employeeId
            });
          }
        }
        
        if (employeesEntries.length > 0) {
          const { error: assignmentError } = await supabase
            .from('assignments_employees')
            .insert(employeesEntries);
          
          if (assignmentError) throw assignmentError;
        }

        // Notify employees about assignment update if published
        if (assignment.published) {
          for (const employeeName of employees) {
            // Skip notifications for the current user
            const employeeId = await getEmployeeIdByName(employeeName);
            if (employeeId && employeeId !== user?.id) {
              addNotification({
                type: 'assignment',
                title: t("notifications.updatedAssignment"),
                message: t("notifications.assignmentUpdated", { 
                  job: assignment.title,
                  date: new Date(assignment.date || new Date()).toLocaleDateString()
                }),
                link: '/Ugeplan'
              });
            }
          }
        }
      }
      
      // Refresh assignments list
      await fetchAssignments();
      
      // Show success message
      toast({
        title: t("planner.assignmentUpdated"),
        description: t("planner.assignmentUpdatedDesc")
      });
      
      return true;
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating assignment',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete an assignment
  const deleteAssignment = async (assignmentId: string) => {
    try {
      // Delete the employee assignments first (due to foreign key constraints)
      const { error: deleteRelationError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (deleteRelationError) throw deleteRelationError;
      
      // Then delete the assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      // Refresh assignments list
      await fetchAssignments();
      
      // Show success message
      toast({
        title: t("planner.assignmentDeleted"),
        description: t("planner.assignmentDeletedDesc")
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
