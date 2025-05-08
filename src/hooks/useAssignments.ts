
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { TableAssignment } from '@/types/supabase';

// Basic CRUD operations for assignments
export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch assignments from Supabase
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('assignments')
          .select(`
            *,
            car:car_id(name),
            employees:assignment_employees(
              profile:profile_id(
                id,
                name
              )
            )
          `);

        if (error) {
          throw error;
        }

        // Transform data to match our Assignment interface
        const transformedAssignments: Assignment[] = data.map((a: any) => {
          // Extract employee names from the nested objects
          const employees = a.employees.map((e: any) => e.profile.name);
          
          return {
            id: a.id,
            title: a.title,
            description: a.description || '',
            date: a.date,
            fromTime: a.from_time,
            toTime: a.to_time,
            location: a.location,
            car: a.car?.name || '',
            employees: employees,
            published: a.published
          };
        });

        setAssignments(transformedAssignments);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast({
          title: t('common.error'),
          description: t('planner.fetchError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [toast, t, user]);

  const createAssignment = async (assignment: Assignment) => {
    if (!user) return assignment;
    
    try {
      // First create the assignment record
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: assignment.title,
          description: assignment.description,
          date: assignment.date,
          from_time: assignment.fromTime,
          to_time: assignment.toTime,
          location: assignment.location,
          car_id: null, // We'll need to fetch the car id by name
          published: assignment.published || false,
          created_by: user.id
        })
        .select();

      if (assignmentError) {
        throw assignmentError;
      }

      if (!assignmentData || assignmentData.length === 0) {
        throw new Error('Failed to create assignment');
      }

      const newAssignmentId = assignmentData[0].id;

      // If a car is specified, find its id and update the assignment
      if (assignment.car) {
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select('id')
          .eq('name', assignment.car)
          .single();

        if (!carError && carData) {
          await supabase
            .from('assignments')
            .update({ car_id: carData.id })
            .eq('id', newAssignmentId);
        }
      }

      // Create employee assignments
      if (assignment.employees && assignment.employees.length > 0) {
        // Get profile IDs from names
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('name', assignment.employees);

        if (profilesError) {
          throw profilesError;
        }

        if (profilesData && profilesData.length > 0) {
          const employeeAssignments = profilesData.map((profile: any) => ({
            assignment_id: newAssignmentId,
            profile_id: profile.id
          }));

          const { error: assignEmployeesError } = await supabase
            .from('assignment_employees')
            .insert(employeeAssignments);

          if (assignEmployeesError) {
            throw assignEmployeesError;
          }
        }
      }

      // Fetch the complete assignment data with relationships
      const { data: completeAssignment, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          *,
          car:car_id(name),
          employees:assignment_employees(
            profile:profile_id(
              id,
              name
            )
          )
        `)
        .eq('id', newAssignmentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Transform to our Assignment interface
      const newAssignment: Assignment = {
        id: completeAssignment.id,
        title: completeAssignment.title,
        description: completeAssignment.description || '',
        date: completeAssignment.date,
        fromTime: completeAssignment.from_time,
        toTime: completeAssignment.to_time,
        location: completeAssignment.location,
        car: completeAssignment.car?.name || '',
        employees: completeAssignment.employees.map((e: any) => e.profile.name),
        published: completeAssignment.published
      };

      setAssignments([...assignments, newAssignment]);

      toast({
        title: t("planner.assignmentCreated"),
        description: t("planner.assignmentCreatedMsg", { title: assignment.title }),
      });

      return newAssignment;
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.createError'),
        variant: "destructive",
      });
      return assignment;
    }
  };

  const updateAssignment = async (updatedAssignment: Assignment) => {
    if (!user) return updatedAssignment;
    
    try {
      // Get the existing assignment
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', updatedAssignment.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Update the assignment record
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          title: updatedAssignment.title,
          description: updatedAssignment.description,
          date: updatedAssignment.date,
          from_time: updatedAssignment.fromTime,
          to_time: updatedAssignment.toTime,
          location: updatedAssignment.location,
          published: updatedAssignment.published
        })
        .eq('id', updatedAssignment.id);

      if (updateError) {
        throw updateError;
      }

      // If car changed, update the car_id
      if (updatedAssignment.car) {
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select('id')
          .eq('name', updatedAssignment.car)
          .single();

        if (!carError && carData) {
          await supabase
            .from('assignments')
            .update({ car_id: carData.id })
            .eq('id', updatedAssignment.id);
        }
      } else {
        // Remove car assignment if empty
        await supabase
          .from('assignments')
          .update({ car_id: null })
          .eq('id', updatedAssignment.id);
      }

      // Update employee assignments
      if (updatedAssignment.employees) {
        // Delete all existing employee assignments
        await supabase
          .from('assignment_employees')
          .delete()
          .eq('assignment_id', updatedAssignment.id);

        if (updatedAssignment.employees.length > 0) {
          // Get profile IDs from names
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('name', updatedAssignment.employees);

          if (profilesError) {
            throw profilesError;
          }

          if (profilesData && profilesData.length > 0) {
            const employeeAssignments = profilesData.map((profile: any) => ({
              assignment_id: updatedAssignment.id,
              profile_id: profile.id
            }));

            const { error: assignEmployeesError } = await supabase
              .from('assignment_employees')
              .insert(employeeAssignments);

            if (assignEmployeesError) {
              throw assignEmployeesError;
            }
          }
        }
      }

      // Update local state
      setAssignments(
        assignments.map((a) =>
          a.id === updatedAssignment.id ? updatedAssignment : a
        )
      );

      toast({
        title: t("planner.assignmentUpdated"),
        description: t("planner.assignmentUpdatedMsg", { title: updatedAssignment.title }),
      });

      return updatedAssignment;
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.updateError'),
        variant: "destructive",
      });
      return updatedAssignment;
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      // Delete from Supabase (will cascade delete assignment_employees)
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        throw error;
      }

      // Update local state
      setAssignments(assignments.filter(a => a.id !== assignmentId));

      toast({
        title: t("planner.assignmentDeleted"),
        description: t("planner.assignmentDeletedMsg"),
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.deleteError'),
        variant: "destructive",
      });
    }
  };

  return {
    assignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    isLoading
  };
};
