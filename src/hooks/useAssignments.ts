
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all assignments with car and employee information
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
          car_id,
          published,
          created_at,
          updated_at,
          cars:car_id (name)
        `);
      
      if (error) throw error;
      
      if (data) {
        // Now fetch the employees for each assignment
        const assignmentsWithEmployees = await Promise.all(data.map(async (assignment) => {
          const { data: employeesData, error: empError } = await supabase
            .from('assignments_employees')
            .select(`
              profiles:user_id (name)
            `)
            .eq('assignment_id', assignment.id);
          
          if (empError) {
            console.error('Error fetching employees for assignment:', empError);
            return {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description || '',
              date: assignment.assignment_date, // Map from assignment_date to date
              fromTime: assignment.from_time, // Map from from_time to fromTime
              toTime: assignment.to_time, // Map from to_time to toTime
              location: assignment.location,
              car: safeProperty(assignment.cars, 'name', ''),
              employees: [],
              published: assignment.published || false
            };
          }
          
          // Extract employee names from the join result and handle possible null values
          const employeeNames = employeesData?.map(emp => {
            // Handle the case where `profiles` might be an error object
            return safeProperty(emp.profiles, 'name', '');
          }) || [];
          
          // Return formatted assignment with employee names
          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            date: assignment.assignment_date, // Map from assignment_date to date
            fromTime: assignment.from_time, // Map from from_time to fromTime
            toTime: assignment.to_time, // Map from to_time to toTime
            location: assignment.location,
            car: safeProperty(assignment.cars, 'name', ''),
            employees: employeeNames.filter(Boolean), // Filter out empty names
            published: assignment.published || false
          };
        }));
        
        setAssignments(assignmentsWithEmployees);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          fetchAssignments(); // Refresh when changes occur
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments_employees'
        },
        () => {
          fetchAssignments(); // Refresh when employee assignments change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      
      // Update local state
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      
      toast({
        title: t("planner.assignmentDeleted"),
        description: t("planner.assignmentDeletedMsg"),
      });
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting assignment',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get car ID by name
  const getCarsIdByName = async (carName: string): Promise<string | null> => {
    if (!carName) return null;
    
    const { data, error } = await supabase
      .from('cars')
      .select('id')
      .eq('name', carName)
      .single();
    
    if (error || !data) {
      console.error('Error getting car ID by name:', error);
      return null;
    }
    
    return data.id;
  };
  
  // Helper function to get employee ID by name
  const getEmployeeIdByName = async (employeeName: string): Promise<string | null> => {
    if (!employeeName) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', employeeName)
      .single();
    
    if (error || !data) {
      console.error('Error getting employee ID by name:', error);
      return null;
    }
    
    return data.id;
  };

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
