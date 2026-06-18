import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData, CarFormData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';
import { usePermissions, useAuth } from '@/context/AuthContext';

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';

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
  const { isDemoMode } = useAuth();
  
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    car_number: '',
    number_plate: '',
    fuel_card_code: '',
    has_trailer_hitch: false,
    is_available: true,
    show_in_planner: true,
    is_auxiliary: false,
    notes: '',
    towing_capacity_with_brakes: null,
    towing_capacity_without_brakes: null,
    total_weight: null,
    sub_department_ids: [],
  });
  const { t } = useTranslation();
  const { toast } = useToast();

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
      is_auxiliary: false,
      notes: '',
      towing_capacity_with_brakes: null,
      towing_capacity_without_brakes: null,
      total_weight: null,
      sub_department_id: null,
      sub_department_ids: [],
    });
  setDialogOpen(true);
  };

  const initFormWithCar = async (car: CarData) => {
    // Fetch sub_department_ids from junction table
    let subDeptIds: string[] = [];
    try {
      const dbClient = getSchemaClient(isDemoMode);
      const { data } = await dbClient
        .from('car_sub_departments')
        .select('sub_department_id')
        .eq('car_id', car.id);
      subDeptIds = (data || []).map((r: any) => r.sub_department_id);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[useCarFormState] Failed to fetch car sub departments:', e);
    }

    setFormData({
      name: car.name,
      car_number: car.car_number,
      number_plate: car.number_plate,
      fuel_card_code: car.fuel_card_code,
      has_trailer_hitch: car.has_trailer_hitch || false,
      is_available: car.is_available,
      show_in_planner: car.show_in_planner ?? true,
      is_auxiliary: car.is_auxiliary ?? false,
      notes: car.notes || '',
      towing_capacity_with_brakes: car.towing_capacity_with_brakes || null,
      towing_capacity_without_brakes: car.towing_capacity_without_brakes || null,
      total_weight: car.total_weight || null,
      sub_department_id: car.sub_department_id || null,
      sub_department_ids: subDeptIds,
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

  const syncSubDepartments = async (carId: string, subDeptIds: string[]) => {
    if (isDemoMode) {
      // In demo mode, skip junction table sync (demo cars are virtual)
      if (import.meta.env.DEV) console.log('[useCarFormState] Demo mode: skipping car_sub_departments sync');
      return;
    }
    // Delete existing
    await supabase.from('car_sub_departments').delete().eq('car_id', carId);
    // Insert new
    if (subDeptIds.length > 0) {
      await supabase.from('car_sub_departments').insert(
        subDeptIds.map(sdId => ({ car_id: carId, sub_department_id: sdId }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Tom underafdelingsliste betyder "ingen tilknytning" — bilen vises kun
    // når der ikke er filtreret på en specifik underafdeling.
    const effectiveSubDeptIds = formData.sub_department_ids || [];
    const effectiveFormData = { ...formData, sub_department_ids: effectiveSubDeptIds };
    
    if (import.meta.env.DEV) console.log('[useCarFormState] Form submitted with data:', { effectiveFormData, currentCar });
    
    try {
      if (currentCar) {
        if (import.meta.env.DEV) console.log('[useCarFormState] Updating existing car:', currentCar.id);
        const updatedCar = await CarSecurityService.updateCar(
          currentCar.id, 
          effectiveFormData, 
          canViewFuelCardCode
        );
        
        // Sync sub-department assignments
        await syncSubDepartments(currentCar.id, effectiveSubDeptIds);
        
        const filteredUpdatedCar = canViewFuelCardCode ? updatedCar : { ...updatedCar, fuel_card_code: '' };
        setCars(
          cars.map((c) => c.id === currentCar.id ? filteredUpdatedCar : c)
        );
        
        toast({
          title: t('cars.vehicleUpdated'),
          description: t('cars.vehicleUpdatedMsg', { name: effectiveFormData.name })
        });
      } else {
        if (import.meta.env.DEV) console.log('[useCarFormState] Creating new car');
        if (createCar) {
          const success = await createCar(effectiveFormData);
          if (!success) {
            return; // Fejl er allerede vist via toast i createCar
          }
        } else {
          if (import.meta.env.DEV) console.log('[useCarFormState] Using fallback security service');
          const newCar = await CarSecurityService.createCar(effectiveFormData, canViewFuelCardCode);
          
          // Sync sub-department assignments for new car
          await syncSubDepartments(newCar.id, effectiveSubDeptIds);
          
          const filteredNewCar = canViewFuelCardCode ? newCar : { ...newCar, fuel_card_code: '' };
          setCars([...cars, filteredNewCar]);
          
          toast({
            title: t('cars.vehicleAdded'),
            description: t('cars.vehicleAddedMsg', { name: effectiveFormData.name })
          });
        }
      }
      
      if (import.meta.env.DEV) console.log('[useCarFormState] Car operation successful, closing dialog');
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      setDialogOpen(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useCarFormState] Error saving car:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error saving vehicle',
        variant: 'destructive'
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
