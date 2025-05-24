
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData, CarFormData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';

interface UseCarFormStateProps {
  cars: CarData[];
  setCars: React.Dispatch<React.SetStateAction<CarData[]>>;
  currentCar: CarData | null;
  setCurrentCar: React.Dispatch<React.SetStateAction<CarData | null>>;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCarFormState = ({ 
  cars, 
  setCars, 
  currentCar, 
  setCurrentCar, 
  setDialogOpen 
}: UseCarFormStateProps) => {
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    car_number: '',
    number_plate: '',
    fuel_card_code: '',
    has_trailer_hitch: false,
    is_available: true,
    notes: '',
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleCreateNew = () => {
    setCurrentCar(null);
    setFormData({
      name: '',
      car_number: '',
      number_plate: '',
      fuel_card_code: '',
      has_trailer_hitch: false,
      is_available: true,
      notes: '',
    });
    setDialogOpen(true);
  };

  const initFormWithCar = (car: CarData) => {
    setFormData({
      name: car.name,
      car_number: car.car_number,
      number_plate: car.number_plate,
      fuel_card_code: car.fuel_card_code,
      has_trailer_hitch: car.has_trailer_hitch || false,
      is_available: car.is_available,
      notes: car.notes || '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentCar) {
        // Update existing car
        const { error } = await supabase
          .from('cars')
          .update({
            name: formData.name,
            car_number: formData.car_number,
            number_plate: formData.number_plate,
            fuel_card_code: formData.fuel_card_code,
            has_trailer_hitch: formData.has_trailer_hitch,
            is_available: formData.is_available,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCar.id);

        if (error) throw error;
        
        // Update local state
        setCars(
          cars.map((c) =>
            c.id === currentCar.id ? { ...c, ...formData, updated_at: new Date().toISOString() } : c
          )
        );
        
        toast({
          title: t('cars.vehicleUpdated'),
          description: t('cars.vehicleUpdatedMsg', { name: formData.name }),
        });
      } else {
        // Create new car
        const { data, error } = await supabase
          .from('cars')
          .insert([
            {
              name: formData.name,
              car_number: formData.car_number,
              number_plate: formData.number_plate,
              fuel_card_code: formData.fuel_card_code,
              has_trailer_hitch: formData.has_trailer_hitch,
              is_available: formData.is_available,
              notes: formData.notes,
            }
          ])
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Add new car to local state
          setCars([...cars, data[0]]);
          
          toast({
            title: t('cars.vehicleAdded'),
            description: t('cars.vehicleAddedMsg', { name: formData.name }),
          });
        }
      }
      
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving car:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error saving vehicle',
        variant: 'destructive',
      });
    }
  };

  return {
    formData,
    setFormData,
    handleCreateNew,
    initFormWithCar,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit
  };
};
