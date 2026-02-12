
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { DemoUserService } from '@/services/demoUserService';

export const useCarData = (canViewFuelCardCode: boolean = false) => {
  const { isDemoMode, userDataLoaded, user } = useAuth();
  const { selectedDepartmentId } = useDepartment();
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
        // Use demo RPC for secure data access with safe retry, then merge locally created demo cars
        const { data, error: fetchError } = await rpcWithRefresh<any[]>('get_demo_cars_with_security');
        
        if (fetchError) throw fetchError;
        
        // Include all demo cars regardless of creation date
        const baseline = (data || []).filter((c: any) => 
          c.show_in_planner !== false
        );
        
        // Merge with locally stored demo cars
        const localCars = DemoUserService.getInstance().getDemoCars?.() || [];
        const merged = [...baseline, ...localCars];
        
        console.log('[useCarData] Successfully fetched', merged.length, 'demo cars (baseline + local)');
        setCars(merged as CarData[]);
      } else {
        // Use production service for production users, filtered by department
        const data = await CarSecurityService.fetchCars(canViewFuelCardCode, selectedDepartmentId);
        console.log('[useCarData] Successfully fetched', data?.length || 0, 'cars (filtered by department)');
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
    try {
      console.log('[useCarData] Creating car with data:', carData);

      if (isDemoMode) {
        // Virtualize demo car creation: store locally and merge into state
        const now = new Date().toISOString();
        const demoCar: CarData = {
          id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: carData.name || 'DEMO Varebil',
          car_number: carData.car_number || 'DEMO-CAR',
          number_plate: carData.number_plate || 'DEMO 000',
          has_trailer_hitch: !!carData.has_trailer_hitch,
          is_available: carData.is_available ?? true,
          show_in_planner: carData.show_in_planner ?? true,
          notes: carData.notes || '',
          fuel_card_code: '***DEMO***',
          created_at: now,
          updated_at: now,
        } as any;

        DemoUserService.getInstance().storeDemoCar(demoCar);
        setCars(prev => [...prev, demoCar]);

        toast({
          title: t('cars.vehicleAdded'),
          description: t('cars.vehicleAddedMsg', { name: demoCar.name })
        });
        return true;
      }

      const data = await CarSecurityService.createCar(carData, canViewFuelCardCode);
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
          // Use demo RPC with JWT-safe retry and merge with local demo cars
          const { data, error: fetchError } = await rpcWithRefresh<any[]>('get_demo_cars_with_security');
          if (fetchError) throw fetchError;
          
          // Include all demo cars regardless of creation date
          let baseline = (data || []).filter((c: any) => 
            c.show_in_planner !== false
          ) as CarData[];
          
          // Client-side fallback if baseline empty
          if (baseline.length === 0) {
            baseline = [
              { id: 'demo-01', name: 'DEMO Varebil 01', car_number: 'CAR-001', number_plate: 'DEMO 01', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 1', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 'demo-02', name: 'DEMO Varebil 02', car_number: 'CAR-002', number_plate: 'DEMO 02', has_trailer_hitch: false, is_available: true, show_in_planner: true, notes: 'Demo vehicle 2', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 'demo-03', name: 'DEMO Varebil 03', car_number: 'CAR-003', number_plate: 'DEMO 03', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 3', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ] as any;
          }
          
          const localCars = DemoUserService.getInstance().getDemoCars();
          const merged = [...baseline, ...localCars];
          
          if (isMounted) {
            setCars(merged);
          }
        } else {
          const data = await CarSecurityService.fetchCars(canViewFuelCardCode, selectedDepartmentId);
          if (isMounted) {
            setCars(data || []);
          }
        }
      } catch (err) {
        console.error('[useCarData] ❌ ERROR fetching cars:', err);
        console.error('[useCarData] ❌ ERROR DETAILS', {
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined,
          isDemoMode,
          userDataLoaded,
          userId: user?.id,
          timestamp: new Date().toISOString()
        });
        
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
          setError(errorMessage);
          
          // Handle authentication errors specifically - DON'T show toast for demo users
          if (errorMessage.includes('logged in') || errorMessage.includes('Authentication required')) {
            if (!isDemoMode) {
              toast({
                title: t('auth.authenticationRequired'),
                description: t('auth.authenticationRequiredDescription'),
                variant: 'destructive',
              });
            }
          } else {
            // Only show error toast for non-demo users or critical errors
            if (!isDemoMode || errorMessage.includes('critical')) {
              toast({
                title: t('common.error'),
                description: t('cars.fetchError'),
                variant: 'destructive',
              });
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isDemoMode) {
      // Demo mode: Fetch once on mount, no polling needed
      // Data persists in sessionStorage and updates via CRUD operations
      loadCars();
      
      return () => {
        isMounted = false;
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
  }, [t, toast, canViewFuelCardCode, isDemoMode, userDataLoaded, user?.id, selectedDepartmentId]);

  return {
    cars,
    setCars,
    loading,
    error,
    fetchCars,
    createCar,
  };
};
