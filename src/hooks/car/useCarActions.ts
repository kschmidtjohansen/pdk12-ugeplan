
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';

export const useCarActions = (cars: CarData[], setCars: React.Dispatch<React.SetStateAction<CarData[]>>) => {
  const [currentCar, setCurrentCar] = useState<CarData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();
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
        
        toast({
          title: t('cars.vehicleDeleted'),
          description: t('cars.vehicleDeletedMsg', { name: currentCar.name }),
        });
      } catch (err) {
        console.error('Error deleting car:', err);
        toast({
          title: t('common.error'),
          description: err instanceof Error ? err.message : 'Error deleting vehicle',
          variant: 'destructive',
        });
      } finally {
        setDeleteDialogOpen(false);
      }
    }
  };

  return {
    currentCar,
    setCurrentCar,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleEdit,
    handleDelete,
    confirmDelete
  };
};
