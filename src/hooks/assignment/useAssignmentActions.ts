
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

// This hook provides actions for managing assignments
export const useAssignmentActions = (
  refetch: () => void,
  setIsDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Create a new assignment
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      // Format car information for storage
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          // If car is just a string ID, fetch the car data
          const { data: carData } = await supabase
            .from('cars')
            .select('*')
            .eq('name', assignmentData.car)
            .single();
            
          if (carData) {
            carId = carData.id;
          }
        } else if (typeof assignmentData.car === 'object') {
          // If car is already an object, use its ID
          carId = (assignmentData.car as Car).id;
        }
      }
      
      // Insert the new assignment
      const { error } = await supabase.from('assignments').insert({
        title: assignmentData.title,
        description: assignmentData.description,
        location: assignmentData.location,
        assignment_date: assignmentData.date,
        from_time: assignmentData.fromTime,
        to_time: assignmentData.toTime,
        car_id: carId,
        published: assignmentData.published || false,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentCreated'),
        description: t('planner.assignmentCreatedDesc'),
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
      // Format car information for storage
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          // If car is just a string ID, fetch the car data
          const { data: carData } = await supabase
            .from('cars')
            .select('*')
            .eq('name', assignmentData.car)
            .single();
            
          if (carData) {
            carId = carData.id;
          }
        } else if (typeof assignmentData.car === 'object') {
          // If car is already an object, use its ID
          carId = (assignmentData.car as Car).id;
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
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedDesc'),
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
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedDesc'),
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
