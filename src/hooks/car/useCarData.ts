
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';

export const useCarData = (canViewFuelCardCode: boolean = false) => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch cars from Supabase with security filtering
  const fetchCars = async () => {
    try {
      console.log('[useCarData] Fetching cars with security filtering...');
      setLoading(true);
      const data = await CarSecurityService.fetchCars(canViewFuelCardCode);
      
      console.log('[useCarData] Successfully fetched', data?.length || 0, 'cars');
      setCars(data || []);
    } catch (err) {
      console.error('[useCarData] Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      toast({
        title: t('common.error'),
        description: t('cars.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new car with security validation
  const createCar = async (carData: Partial<CarData>) => {
    try {
      console.log('[useCarData] Creating car with data:', carData);
      
      const data = await CarSecurityService.createCar(carData, canViewFuelCardCode);
      
      // Add the new car to local state (with proper fuel card filtering)
      const filteredData = canViewFuelCardCode ? data : { ...data, fuel_card_code: '' };
      setCars(prevCars => [...prevCars, filteredData]);
      
      toast({
        title: t('cars.vehicleAdded'),
        description: t('cars.vehicleAddedMsg', { name: carData.name })
      });
      
      return true;
    } catch (err) {
      console.error('[useCarData] Error creating car:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create car';
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Load cars on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadCars = async () => {
      try {
        const data = await CarSecurityService.fetchCars(canViewFuelCardCode);
        
        if (isMounted) {
          setCars(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch cars');
          toast({
            title: t('common.error'),
            description: t('common.error'),
            variant: 'destructive',
          });
          setLoading(false);
        }
      }
    };
    
    loadCars();
    
    return () => {
      isMounted = false;
    };
  }, [t, toast, canViewFuelCardCode]);

  return {
    cars,
    setCars,
    loading,
    error,
    fetchCars,
    createCar,
  };
};
