
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useCarData = (canViewFuelCardCode: boolean = false) => {
  const { isDemoMode } = useAuth();
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const client = getSchemaClient(isDemoMode);

  // Fetch cars from Supabase with enhanced security
  const fetchCars = async () => {
    try {
      console.log('[useCarData] Fetching cars with enhanced security...');
      setLoading(true);
      setError(null);
      
      const data = await CarSecurityService.fetchCars(canViewFuelCardCode);
      
      console.log('[useCarData] Successfully fetched', data?.length || 0, 'cars');
      setCars(data || []);
    } catch (err) {
      console.error('[useCarData] Error fetching cars:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      
      // Handle authentication errors specifically
      if (errorMessage.includes('logged in') || errorMessage.includes('Authentication required')) {
        toast({
          title: t('auth.authenticationRequired'),
          description: t('auth.authenticationRequiredDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('cars.fetchError'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Create a new car with enhanced security validation
  const createCar = async (carData: Partial<CarData>) => {
    try {
      console.log('[useCarData] Creating car with data:', carData);
      
      const data = await CarSecurityService.createCar(carData, canViewFuelCardCode);
      
      // Add the new car to local state (fuel card filtering is handled by the database function)
      setCars(prevCars => [...prevCars, data]);
      
      toast({
        title: t('cars.vehicleAdded'),
        description: t('cars.vehicleAddedMsg', { name: carData.name })
      });
      
      return true;
    } catch (err) {
      console.error('[useCarData] Error creating car:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create car';
      
      // Handle authentication errors specifically
      if (errorMessage.includes('logged in') || errorMessage.includes('Authentication required')) {
        toast({
          title: t('auth.authenticationRequired'),
          description: t('auth.authenticationRequiredDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  // Load cars on component mount with enhanced error handling and realtime subscription
  useEffect(() => {
    let isMounted = true;
    
    const loadCars = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await CarSecurityService.fetchCars(canViewFuelCardCode);
        
        if (isMounted) {
          setCars(data || []);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
          setError(errorMessage);
          
          // Handle authentication errors specifically
          if (errorMessage.includes('logged in') || errorMessage.includes('Authentication required')) {
            toast({
              title: t('auth.authenticationRequired'),
              description: t('auth.authenticationRequiredDescription'),
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('common.error'),
              description: t('cars.fetchError'),
              variant: 'destructive',
            });
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up realtime subscription for cars (both public and demo schemas)
    const schema = isDemoMode ? 'demo' : 'public';
    const channel = supabase
      .channel(`cars-changes-${schema}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: schema,
          table: 'cars'
        },
        (payload) => {
          console.log(`[useCarData] Realtime update received from ${schema} schema:`, payload);
          // Refresh cars when any change occurs
          if (isMounted) {
            loadCars().catch(console.error);
          }
        }
      )
      .subscribe();
    
    loadCars();
    
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
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
