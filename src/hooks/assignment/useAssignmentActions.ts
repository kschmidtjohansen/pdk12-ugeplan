
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

// This hook provides actions for managing assignments
export const useAssignmentActions = (
  refetch: () => void,
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Create a new assignment
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      // Format car information for storage
      let carInfo = null;
      if (assignmentData.car && typeof assignmentData.car === 'string') {
        // If car is just a string ID, fetch the car data
        const { data: carData } = await supabase
          .from('cars')
          .select('*')
          .eq('id', assignmentData.car)
          .single();
          
        if (carData) {
          carInfo = {
            id: carData.id,
            name: carData.name || '',
            license_plate: carData.license_plate || ''
          };
        }
      } else if (assignmentData.car && typeof assignmentData.car === 'object') {
        // If car is already an object, use it directly
        carInfo = assignmentData.car;
      }
      
      // Determine assignment type from the assignment data
      const assignmentType = assignmentData.task_type || 'standard';
      
      // Insert the new assignment
      const { error } = await supabase.from('assignments').insert({
        ...assignmentData,
        car: carInfo,
        task_type: assignmentType,
        published: false,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentCreated'),
        description: t('planner.assignmentCreatedDesc'),
      });
      
      refetch();
      setIsDialogOpen(false);
    } catch (error) {
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
      let carInfo = null;
      if (assignmentData.car && typeof assignmentData.car === 'string') {
        // If car is just a string ID, fetch the car data
        const { data: carData } = await supabase
          .from('cars')
          .select('*')
          .eq('id', assignmentData.car)
          .single();
          
        if (carData) {
          carInfo = {
            id: carData.id,
            name: carData.name || '',
            license_plate: carData.license_plate || ''
          };
        }
      } else if (assignmentData.car && typeof assignmentData.car === 'object') {
        // If car is already an object, use it directly
        carInfo = assignmentData.car;
      }
      
      // Determine assignment type
      const assignmentType = assignmentData.task_type || 'standard';
      
      // Update the assignment
      const { error } = await supabase
        .from('assignments')
        .update({
          ...assignmentData,
          car: carInfo,
          task_type: assignmentType,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedDesc'),
      });
      
      refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
    }
  }, [toast, t, refetch, setIsDialogOpen]);

  return {
    createAssignment,
    updateAssignment
  };
};
