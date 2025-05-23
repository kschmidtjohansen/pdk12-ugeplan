
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
        toast(t('common.error'), {
          description: err instanceof Error ? err.message : 'Error deleting vehicle',
        });
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

      // Check if the notes column exists first by trying to update only is_available
      const { error: testError } = await supabase
        .from('cars')
        .update({ is_available: isAvailable })
        .eq('id', car.id);

      if (testError) {
        console.error("Error testing car update:", testError);
        throw testError;
      }

      // Now try to update with notes
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
        console.error("Error updating car with notes:", error);
        
        // If updating with notes fails, it might mean the notes column doesn't exist
        // Show an error but still update the local state for is_available
        toast(t('common.warning'), {
          description: t('cars.notesFeatureUnavailable'),
        });
        
        // Update local state without notes
        setCars(cars.map(c => 
          c.id === car.id 
            ? { ...c, is_available: isAvailable }
            : c
        ));
      } else {
        // Update local state with all data
        setCars(cars.map(c => 
          c.id === car.id 
            ? { ...c, is_available: isAvailable, notes: notes }
            : c
        ));
      }
      
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
