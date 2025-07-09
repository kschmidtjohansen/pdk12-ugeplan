
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';

export const useCarData = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch cars from Supabase
  const fetchCars = async () => {
    try {
      console.log('[useCarData] Fetching cars...');
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('car_number', { ascending: true });
      
      console.log('[useCarData] Fetch cars response:', { data, error });
      if (error) throw error;
      setCars(data || []);
      console.log('[useCarData] Successfully fetched', data?.length || 0, 'cars');
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

  // Create a new car
  const createCar = async (carData: Partial<CarData>) => {
    try {
      console.log('[useCarData] Creating car with data:', carData);
      
      // Validate required fields
      if (!carData.name || !carData.car_number || !carData.number_plate || !carData.fuel_card_code) {
        const missingFields = [];
        if (!carData.name) missingFields.push('name');
        if (!carData.car_number) missingFields.push('car_number');
        if (!carData.number_plate) missingFields.push('number_plate');
        if (!carData.fuel_card_code) missingFields.push('fuel_card_code');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('cars')
        .insert({
          name: carData.name,
          car_number: carData.car_number,
          number_plate: carData.number_plate,
          fuel_card_code: carData.fuel_card_code,
          has_trailer_hitch: carData.has_trailer_hitch || false,
          is_available: carData.is_available !== undefined ? carData.is_available : true,
          notes: carData.notes || null
        })
        .select()
        .single();
      
      console.log('[useCarData] Create car response:', { data, error });
      if (error) {
        console.error('[useCarData] Car creation error:', error);
        throw error;
      }
      
      // Add the new car to local state
      if (data) {
        setCars(prevCars => [...prevCars, data]);
        toast({
          title: t('cars.vehicleAdded'),
          description: t('cars.vehicleAddedMsg', { name: carData.name })
        });
        return true;
      }
      
      return false;
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
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .order('car_number', { ascending: true });
        
        if (error) throw error;
        
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
  }, [t, toast]);

  return {
    cars,
    setCars,
    loading,
    error,
    fetchCars,
    createCar,
  };
};
