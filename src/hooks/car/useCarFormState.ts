import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useTranslation } from '@/context/TranslationContext';
import { CarData, CarFormData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';
import { usePermissions } from '@/context/AuthContext';

interface UseCarFormStateProps {
  cars: CarData[];
  setCars: React.Dispatch<React.SetStateAction<CarData[]>>;
  currentCar: CarData | null;
  setCurrentCar: React.Dispatch<React.SetStateAction<CarData | null>>;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createCar?: (carData: Partial<CarData>) => Promise<boolean>;
}

export const useCarFormState = ({ 
  cars, 
  setCars, 
  currentCar, 
  setCurrentCar, 
  setDialogOpen,
  createCar
}: UseCarFormStateProps) => {
  const { canViewFuelCardCode } = usePermissions();
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    car_number: '',
    number_plate: '',
    fuel_card_code: '',
    has_trailer_hitch: false,
    is_available: true,
    show_in_planner: true,
    notes: '',
  });
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
      show_in_planner: true,
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
      show_in_planner: car.show_in_planner ?? true,
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
    
    console.log('[useCarFormState] Form submitted with data:', { formData, currentCar });
    
    try {
      if (currentCar) {
        console.log('[useCarFormState] Updating existing car:', currentCar.id);
        // Update existing car using security service
        const updatedCar = await CarSecurityService.updateCar(
          currentCar.id, 
          formData, 
          canViewFuelCardCode
        );
        
        // Update local state (filter fuel card if user doesn't have permission)
        const filteredUpdatedCar = canViewFuelCardCode ? updatedCar : { ...updatedCar, fuel_card_code: '' };
        setCars(
          cars.map((c) => c.id === currentCar.id ? filteredUpdatedCar : c)
        );
        
        toast(t('cars.vehicleUpdated'), {
          description: t('cars.vehicleUpdatedMsg', { name: formData.name }),
        });
      } else {
        console.log('[useCarFormState] Creating new car');
        // Use the createCar function if available, otherwise fallback to direct insert
        if (createCar) {
          const success = await createCar(formData);
          if (!success) {
            throw new Error('Failed to create car using createCar function');
          }
        } else {
          console.log('[useCarFormState] Using fallback security service');
          // Create new car using security service (fallback)
          const newCar = await CarSecurityService.createCar(formData, canViewFuelCardCode);
          
          // Add new car to local state (filter fuel card if user doesn't have permission)
          const filteredNewCar = canViewFuelCardCode ? newCar : { ...newCar, fuel_card_code: '' };
          setCars([...cars, filteredNewCar]);
          
          toast(t('cars.vehicleAdded'), {
            description: t('cars.vehicleAddedMsg', { name: formData.name }),
          });
        }
      }
      
      console.log('[useCarFormState] Car operation successful, closing dialog');
      setDialogOpen(false);
    } catch (err) {
      console.error('[useCarFormState] Error saving car:', err);
      toast(t('common.error'), {
        description: err instanceof Error ? err.message : 'Error saving vehicle',
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
