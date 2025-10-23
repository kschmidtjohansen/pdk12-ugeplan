
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useCarData = (canViewFuelCardCode: boolean = false) => {
  const { isDemoMode, userDataLoaded, user } = useAuth();
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch cars from Supabase with enhanced security
  const fetchCars = async () => {
    try {
      console.log('[useCarData] Fetching cars with enhanced security...');
      setLoading(true);
      setError(null);
      
      if (isDemoMode) {
        // Use demo RPC for demo users
        const { data, error: fetchError } = await supabase.rpc('get_demo_cars_with_security');
        if (fetchError) throw fetchError;
        
        // Filter to only show explicitly demo-tagged vehicles
        const demoOnly = (data || []).filter((c: any) => {
          const carNumber = (c.car_number || '').toString();
          const name = (c.name || '').toString().toLowerCase();
          const looksDemo = /^(CAR|VAN)-/i.test(carNumber) || name.includes('demo');
          const isProdNumber = /^\d+$/.test(carNumber); // Exclude purely numeric like "01", "02"
          return looksDemo && !isProdNumber;
        });
        
        console.log('[useCarData] Successfully fetched', demoOnly?.length || 0, 'demo cars');
        setCars(demoOnly as CarData[]);
      } else {
        // Use production service for production users
        const data = await CarSecurityService.fetchCars(canViewFuelCardCode);
        console.log('[useCarData] Successfully fetched', data?.length || 0, 'cars');
        setCars(data || []);
      }
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
    if (isDemoMode) {
      toast({
        title: t('common.warning'),
        description: 'Demo mode is read-only. Cannot create vehicles.',
        variant: 'destructive',
      });
      return false;
    }

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
    // Wait for userDataLoaded to stabilize before fetching
    if (!userDataLoaded || !user) return;
    
    let isMounted = true;
    
    const loadCars = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isDemoMode) {
          const { data, error: fetchError } = await supabase.rpc('get_demo_cars_with_security');
          if (fetchError) throw fetchError;
          let demoCars = (data || []) as CarData[];
          
          // Client-side fallback: If no demo cars, synthesize some
          if (demoCars.length === 0) {
            demoCars = [
              { id: 'demo-01', name: 'DEMO Varebil 01', car_number: 'D01', number_plate: 'DEMO 01', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 1', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 'demo-02', name: 'DEMO Varebil 02', car_number: 'D02', number_plate: 'DEMO 02', has_trailer_hitch: false, is_available: true, show_in_planner: true, notes: 'Demo vehicle 2', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 'demo-03', name: 'DEMO Varebil 03', car_number: 'D03', number_plate: 'DEMO 03', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 3', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 'demo-04', name: 'DEMO Varebil 04', car_number: 'D04', number_plate: 'DEMO 04', has_trailer_hitch: false, is_available: true, show_in_planner: true, notes: 'Demo vehicle 4', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 'demo-05', name: 'DEMO Varebil 05', car_number: 'D05', number_plate: 'DEMO 05', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 5', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ] as any;
          }
          
          if (isMounted) {
            setCars(demoCars);
          }
        } else {
          const data = await CarSecurityService.fetchCars(canViewFuelCardCode);
          if (isMounted) {
            setCars(data || []);
          }
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

    if (isDemoMode) {
      // Demo mode: Use polling instead of realtime
      loadCars();
      const pollInterval = setInterval(() => {
        if (isMounted) {
          loadCars().catch(console.error);
        }
      }, 40000); // Poll every 40 seconds
      
      return () => {
        isMounted = false;
        clearInterval(pollInterval);
      };
    } else {
      // Production mode: Use realtime subscriptions
      const channel = supabase
        .channel(`cars-changes-public`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cars'
          },
          (payload) => {
            console.log(`[useCarData] Realtime update received:`, payload);
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
    }
  }, [t, toast, canViewFuelCardCode, isDemoMode, userDataLoaded, user?.id]);

  return {
    cars,
    setCars,
    loading,
    error,
    fetchCars,
    createCar,
  };
};
