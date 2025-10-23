import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { CarSecurityService } from '@/services/carSecurityService';
import { usePermissions, useAuth } from '@/context/AuthContext';

export const useCarActions = (cars: CarData[], setCars: React.Dispatch<React.SetStateAction<CarData[]>>) => {
  const { canViewFuelCardCode } = usePermissions();
  const { isDemoMode } = useAuth();
  const [currentCar, setCurrentCar] = useState<CarData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState<boolean>(false);
  const [availableDialogOpen, setAvailableDialogOpen] = useState<boolean>(false);
  
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleEdit = (car: CarData) => {
    setCurrentCar(car);
    return car;
  };

  const handleDelete = (car: CarData) => {
    setCurrentCar(car);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (forceDelete: boolean = false) => {
    if (currentCar) {
      try {
        let assignmentsAffected = 0;

        if (forceDelete) {
          // First, clean up assignments that reference this car
          console.log('Force deleting car - cleaning up assignments first');
          
          // Update assignments that have this car as the main car_id
          const client = getSchemaClient(isDemoMode);
          const { data: mainCarAssignments, error: mainCarError } = await client
            .from('assignments')
            .update({ car_id: null })
            .eq('car_id', currentCar.id)
            .select('id');
          
          if (mainCarError) {
            console.error('Error updating main car assignments:', mainCarError);
            throw mainCarError;
          }

          if (mainCarAssignments) {
            assignmentsAffected += mainCarAssignments.length;
          }

          // Update assignments that have this car in the car_ids array
          const { data: multiCarAssignments, error: multiCarError } = await client
            .from('assignments')
            .select('id, car_ids')
            .contains('car_ids', [currentCar.id]);
          
          if (multiCarError) {
            console.error('Error fetching multi-car assignments:', multiCarError);
            throw multiCarError;
          }

          if (multiCarAssignments && multiCarAssignments.length > 0) {
            // Update each assignment to remove this car from car_ids array
            for (const assignment of multiCarAssignments) {
              if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
                const updatedCarIds = assignment.car_ids.filter(id => id !== currentCar.id);
                
                const { error: updateError } = await client
                  .from('assignments')
                  .update({ car_ids: updatedCarIds.length > 0 ? updatedCarIds : null })
                  .eq('id', assignment.id);
                
                if (updateError) {
                  console.error('Error updating assignment car_ids:', updateError);
                  throw updateError;
                }
                
                assignmentsAffected++;
              }
            }
          }

          console.log(`Cleaned up ${assignmentsAffected} assignments`);
        } else {
          // Check if the car is referenced in any assignments (original logic)
          const client = getSchemaClient(isDemoMode);
          const { data: assignments, error: checkError } = await client
            .from('assignments')
            .select('id')
            .or(`car_id.eq.${currentCar.id},car_ids.cs.{${currentCar.id}}`)
            .limit(1);
          
          if (checkError) {
            console.error('Error checking car assignments:', checkError);
            throw checkError;
          }
          
          // If car is referenced in assignments, prevent deletion
          if (assignments && assignments.length > 0) {
            toast({
              title: t('cars.cannotDeleteCarInUse'),
              description: t('cars.cannotDeleteCarInUseDesc'),
              variant: 'destructive'
            });
            setDeleteDialogOpen(false);
            return;
          }
        }
        
        // Now delete the car
        const client = getSchemaClient(isDemoMode);
        const { error } = await client
          .from('cars')
          .delete()
          .eq('id', currentCar.id);
        
        if (error) throw error;
        
        setCars(cars.filter(car => car.id !== currentCar.id));
        
        const successMessage = forceDelete && assignmentsAffected > 0
          ? t('cars.vehicleDeletedWithCleanup', { 
              name: currentCar.name, 
              count: assignmentsAffected 
            })
          : t('cars.vehicleDeletedMsg', { name: currentCar.name });
        
        toast({
          title: t('cars.vehicleDeleted'),
          description: successMessage
        });
      } catch (err) {
        console.error('Error deleting car:', err);
        
        // Check if it's a foreign key constraint error
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
          toast({
            title: t('cars.cannotDeleteCarInUse'),
            description: t('cars.cannotDeleteCarInUseDesc'),
            variant: 'destructive'
          });
        } else {
          toast({
            title: t('common.error'),
            description: t('cars.deleteError'),
            variant: 'destructive'
          });
        }
      } finally {
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleToggleAvailability = (car: CarData) => {
    // Open the appropriate dialog based on current availability state
    if (car.is_available) {
      // Going from available to unavailable - show unavailable dialog
      setCurrentCar(car);
      setUnavailableDialogOpen(true);
    } else {
      // Going from unavailable to available - show available dialog if notes exist
      setCurrentCar(car);
      if (car.notes) {
        setAvailableDialogOpen(true);
      } else {
        // If no notes, directly update the availability
        updateAvailabilityStatus(car, true, null);
      }
    }
  };
  
  const markCarUnavailable = async (car: CarData, note: string) => {
    updateAvailabilityStatus(car, false, note);
    setUnavailableDialogOpen(false);
  };
  
  const markCarAvailableKeepNote = async (car: CarData) => {
    if (car && car.notes !== undefined) {
      updateAvailabilityStatus(car, true, car.notes);
    }
    setAvailableDialogOpen(false);
  };
  
  const markCarAvailableDeleteNote = async (car: CarData) => {
    updateAvailabilityStatus(car, true, null);
    setAvailableDialogOpen(false);
  };
  
  const updateAvailabilityStatus = async (car: CarData, isAvailable: boolean, notes: string | null) => {
    try {
      console.log("[useCarActions] Updating car availability:", {
        car_id: car.id,
        is_available: isAvailable,
        notes: notes
      });

      // Update the car with both availability and notes
      const client = getSchemaClient(isDemoMode);
      const { error, data } = await client
        .from('cars')
        .update({ 
          is_available: isAvailable,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', car.id)
        .select();
      
      console.log("[useCarActions] Car update response:", { error, data });
      
      if (error) {
        console.error("[useCarActions] Error updating car:", error);
        throw error;
      }
      
      // Update local state with all data
      setCars(cars.map(c => 
        c.id === car.id 
          ? { ...c, is_available: isAvailable, notes: notes }
          : c
      ));
      
      // Show success message
      if (isAvailable) {
        toast({
          title: t('cars.vehicleAvailable'),
          description: t('cars.vehicleAvailableMsg', { name: car.name })
        });
      } else {
        toast({
          title: t('cars.vehicleUnavailable'),
          description: t('cars.vehicleUnavailableMsg', { name: car.name })
        });
      }
    } catch (err) {
      console.error('Error updating car availability:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating vehicle availability',
        variant: 'destructive'
      });
    }
  };

  return {
    currentCar,
    setCurrentCar,
    deleteDialogOpen,
    setDeleteDialogOpen,
    unavailableDialogOpen,
    setUnavailableDialogOpen,
    availableDialogOpen,
    setAvailableDialogOpen,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleToggleAvailability,
    markCarUnavailable,
    markCarAvailableKeepNote,
    markCarAvailableDeleteNote
  };
};
