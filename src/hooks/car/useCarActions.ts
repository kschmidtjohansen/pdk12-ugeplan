import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';

export const useCarActions = (cars: CarData[], setCars: React.Dispatch<React.SetStateAction<CarData[]>>) => {
  const [currentCar, setCurrentCar] = useState<CarData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState<boolean>(false);
  const [availableDialogOpen, setAvailableDialogOpen] = useState<boolean>(false);
  
  const { t } = useTranslation();

  const handleEdit = (car: CarData) => {
    setCurrentCar(car);
    return car;
  };

  const handleDelete = (car: CarData) => {
    setCurrentCar(car);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentCar) {
      try {
        // First check if the car is referenced in any assignments
        const { data: assignments, error: checkError } = await supabase
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
          toast(t('cars.cannotDeleteCarInUse'), {
            description: t('cars.cannotDeleteCarInUseDesc'),
          });
          setDeleteDialogOpen(false);
          return;
        }
        
        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', currentCar.id);
        
        if (error) throw error;
        
        setCars(cars.filter(car => car.id !== currentCar.id));
        
        toast(t('cars.vehicleDeleted'), {
          description: t('cars.vehicleDeletedMsg', { name: currentCar.name }),
        });
      } catch (err) {
        console.error('Error deleting car:', err);
        
        // Check if it's a foreign key constraint error
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
          toast(t('cars.cannotDeleteCarInUse'), {
            description: t('cars.cannotDeleteCarInUseDesc'),
          });
        } else {
          toast(t('common.error'), {
            description: t('cars.deleteError'),
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
      console.log("Updating car availability:", {
        car_id: car.id,
        is_available: isAvailable,
        notes: notes
      });

      // Update the car with both availability and notes
      const { error, data } = await supabase
        .from('cars')
        .update({ 
          is_available: isAvailable,
          notes: notes 
        })
        .eq('id', car.id)
        .select();
      
      console.log("Supabase response:", { error, data });
      
      if (error) {
        console.error("Error updating car:", error);
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
        toast(t('cars.vehicleAvailable'), {
          description: t('cars.vehicleAvailableMsg', { name: car.name })
        });
      } else {
        toast(t('cars.vehicleUnavailable'), {
          description: t('cars.vehicleUnavailableMsg', { name: car.name })
        });
      }
    } catch (err) {
      console.error('Error updating car availability:', err);
      toast(t('common.error'), {
          description: err instanceof Error ? err.message : 'Error updating vehicle availability',
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
