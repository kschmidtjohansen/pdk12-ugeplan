import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { isValidUUID, safeUUID } from '@/utils/uuidValidation';

// This hook provides actions for managing assignments
export const useAssignmentActions = (
  refetch: () => void,
  setIsDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Helper function to get profile ID by name
  const getProfileIdByName = async (name: string): Promise<string | null> => {
    try {
      if (!name || typeof name !== 'string') {
        console.warn('Invalid name provided for profile lookup:', name);
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', name)
        .single();
        
      if (error) {
        console.error('Error getting profile by name:', error);
        return null;
      }
      
      // Validate the returned ID
      const profileId = safeUUID(data?.id);
      if (!profileId) {
        console.warn('Invalid UUID returned for profile:', name, data?.id);
        return null;
      }
      
      return profileId;
    } catch (err) {
      console.error('Exception getting profile by name:', err);
      return null;
    }
  };

  // Create a new assignment
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      console.log("Creating assignment with data:", assignmentData);
      
      // Format car information for storage - FIXED to handle array of cars
      let carId = null;
      if (assignmentData.car) {
        if (Array.isArray(assignmentData.car)) {
          // For now, take the first car from the array
          // In the future, this should be updated to support multiple cars in the database
          if (assignmentData.car.length > 0) {
            const firstCar = assignmentData.car[0];
            carId = safeUUID(typeof firstCar === 'string' ? firstCar : firstCar.id);
          }
        } else if (typeof assignmentData.car === 'string') {
          carId = safeUUID(assignmentData.car);
        } else if (typeof assignmentData.car === 'object') {
          carId = safeUUID(assignmentData.car.id);
        }
      }
      
      // Insert the new assignment
      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          published: assignmentData.published || false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // If there are employees, link them to the assignment
      if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment?.id) {
        console.log("Assignment created, now linking employees:", assignmentData.employees);
        // Get profile IDs for each employee name
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          // Skip any non-string values that might have gotten in the array
          if (typeof employeeName !== 'string') {
            console.warn("Skipping invalid employee data:", employeeName);
            continue;
          }
          
          const profileId = await getProfileIdByName(employeeName);
          if (profileId) {
            employeeInserts.push({
              assignment_id: newAssignment.id,
              user_id: profileId
            });
          } else {
            console.warn(`Could not find valid profile ID for employee: ${employeeName}`);
          }
        }
        
        // Insert employee associations
        if (employeeInserts.length > 0) {
          const { error: employeeError } = await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
            
          if (employeeError) {
            console.error('Error linking employees to assignment:', employeeError);
          }
        }
      }
      
      toast({
        title: t('planner.assignmentCreated'),
        description: t('planner.assignmentCreatedMsg', { title: assignmentData.title }),
      });
      
      refetch();
      if (setIsDialogOpen) setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorCreatingAssignment'),
        variant: "destructive",
      });
    }
  }, [toast, t, refetch, setIsDialogOpen]);

  // Update an existing assignment
  const updateAssignment = useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid assignment ID provided');
      }

      console.log("Updating assignment with data:", assignmentData);
      
      // Format car information for storage - FIXED to handle array of cars
      let carId = null;
      if (assignmentData.car) {
        if (Array.isArray(assignmentData.car)) {
          // For now, take the first car from the array
          // In the future, this should be updated to support multiple cars in the database
          if (assignmentData.car.length > 0) {
            const firstCar = assignmentData.car[0];
            carId = safeUUID(typeof firstCar === 'string' ? firstCar : firstCar.id);
          }
        } else if (typeof assignmentData.car === 'string') {
          carId = safeUUID(assignmentData.car);
        } else if (typeof assignmentData.car === 'object') {
          carId = safeUUID(assignmentData.car.id);
        }
      }
      
      // Update the assignment
      const { error } = await supabase
        .from('assignments')
        .update({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          published: assignmentData.published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Remove existing employee assignments
      const { error: deleteError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', id);
        
      if (deleteError) {
        console.error('Error removing existing employee assignments:', deleteError);
      }
      
      // If there are employees, link them to the assignment
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        console.log("Assignment updated, now linking employees:", assignmentData.employees);
        // Get profile IDs for each employee name
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          // Skip any non-string values that might have gotten in the array
          if (typeof employeeName !== 'string') {
            console.warn("Skipping invalid employee data:", employeeName);
            continue;
          }
          
          const profileId = await getProfileIdByName(employeeName);
          if (profileId) {
            employeeInserts.push({
              assignment_id: id,
              user_id: profileId
            });
          } else {
            console.warn(`Could not find valid profile ID for employee: ${employeeName}`);
          }
        }
        
        // Insert employee associations
        if (employeeInserts.length > 0) {
          const { error: employeeError } = await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
            
          if (employeeError) {
            console.error('Error linking employees to assignment:', employeeError);
          }
        }
      }
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedMsg', { title: assignmentData.title }),
      });
      
      refetch();
      if (setIsDialogOpen) setIsDialogOpen(false);
      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t, refetch, setIsDialogOpen]);
  
  // Delete an assignment
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid assignment ID provided');
      }

      // First delete associated employee assignments
      const { error: empError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', id);
        
      if (empError) {
        console.error('Error deleting employee assignments:', empError);
      }
      
      // Then delete the assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg'),
      });
      
      refetch();
      return true;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorDeletingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t, refetch]);

  return {
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
