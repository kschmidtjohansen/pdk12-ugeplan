
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { CarSecurityService } from '@/services/carSecurityService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { DemoUserService } from '@/services/demoUserService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useCarData = (canViewFuelCardCode: boolean = false) => {
  const { isDemoMode, userDataLoaded, user } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const queryKey = ['cars', isDemoMode, selectedDepartmentId, selectedSubDepartmentId, canViewFuelCardCode] as const;

  const fetchCarsFn = async (): Promise<CarData[]> => {
    if (import.meta.env.DEV) console.log('[useCarData] Fetching cars with enhanced security...');

    if (isDemoMode) {
      const { data, error: fetchError } = await rpcWithRefresh<any[]>('get_demo_cars_with_security');
      if (fetchError) throw fetchError;

      const DEMO_BASELINE_DATE = '2025-10-23T00:00:00Z';
      let baseline = (data || []).filter((c: any) => 
        c.show_in_planner !== false && 
        new Date(c.created_at) >= new Date(DEMO_BASELINE_DATE)
      ) as CarData[];

      if (baseline.length === 0) {
        baseline = [
          { id: 'demo-01', name: 'DEMO Varebil 01', car_number: 'CAR-001', number_plate: 'DEMO 01', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 1', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'demo-02', name: 'DEMO Varebil 02', car_number: 'CAR-002', number_plate: 'DEMO 02', has_trailer_hitch: false, is_available: true, show_in_planner: true, notes: 'Demo vehicle 2', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'demo-03', name: 'DEMO Varebil 03', car_number: 'CAR-003', number_plate: 'DEMO 03', has_trailer_hitch: true, is_available: true, show_in_planner: true, notes: 'Demo vehicle 3', fuel_card_code: '***DEMO***', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ] as any;
      }

      const localCars = DemoUserService.getInstance().getDemoCars();
      const merged = [...baseline, ...localCars];
      if (import.meta.env.DEV) console.log('[useCarData] Successfully fetched', merged.length, 'demo cars (baseline + local)');
      return merged;
    } else {
      const data = await CarSecurityService.fetchCars(canViewFuelCardCode, selectedDepartmentId, selectedSubDepartmentId);
      if (import.meta.env.DEV) console.log('[useCarData] Successfully fetched', data?.length || 0, 'cars (filtered by department)');
      return data || [];
    }
  };

  const { data: cars = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: fetchCarsFn,
    enabled: userDataLoaded && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Show error toasts
  useEffect(() => {
    if (!queryError) return;
    const errorMessage = queryError instanceof Error ? queryError.message : 'Failed to fetch cars';
    if (errorMessage.includes('logged in') || errorMessage.includes('Authentication required')) {
      if (!isDemoMode) {
        toast({ title: t('auth.authenticationRequired'), description: t('auth.authenticationRequiredDescription'), variant: 'destructive' });
      }
    } else if (!isDemoMode || errorMessage.includes('critical')) {
      toast({ title: t('common.error'), description: t('cars.fetchError'), variant: 'destructive' });
    }
  }, [queryError]);

  // setCars wrapper for optimistic updates compatibility
  const setCars: React.Dispatch<React.SetStateAction<CarData[]>> = (updater) => {
    queryClient.setQueryData(queryKey, (old: CarData[] | undefined) => {
      return typeof updater === 'function' ? (updater as (prev: CarData[]) => CarData[])(old || []) : updater;
    });
  };

  // Create a new car with enhanced security validation
  const createCar = async (carData: Partial<CarData>) => {
    try {
      console.log('[useCarData] Creating car with data:', carData);

      if (isDemoMode) {
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

        toast({ title: t('cars.vehicleAdded'), description: t('cars.vehicleAddedMsg', { name: demoCar.name }) });
        return true;
      }

      const { sub_department_ids, ...carDataWithoutSubDeptIds } = carData as any;
      const enrichedData = {
        ...carDataWithoutSubDeptIds,
        department_id: selectedDepartmentId || null,
      };
      const data = await CarSecurityService.createCar(enrichedData, canViewFuelCardCode);
      
      // Sync sub-department assignments via junction table (skip in demo mode)
      if (!isDemoMode) {
        const subDeptIds = (carData as any).sub_department_ids || [];
        if (subDeptIds.length > 0) {
          await supabase.from('car_sub_departments').insert(
            subDeptIds.map((sdId: string) => ({ car_id: data.id, sub_department_id: sdId }))
          );
        }
      }
      
      setCars(prevCars => [...prevCars, data]);

      toast({ title: t('cars.vehicleAdded'), description: t('cars.vehicleAddedMsg', { name: carData.name }) });
      return true;
    } catch (err) {
      console.error('[useCarData] Error creating car:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create car';
      if (errorMessage.includes('logged in') || errorMessage.includes('Authentication required')) {
        toast({ title: t('auth.authenticationRequired'), description: t('auth.authenticationRequiredDescription'), variant: 'destructive' });
      } else {
        toast({ title: t('common.error'), description: errorMessage, variant: 'destructive' });
      }
      return false;
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!userDataLoaded || !user) return;

    if (isDemoMode) return; // Demo: no realtime needed

    const channel = supabase
      .channel(`cars-changes-public`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, (payload) => {
        console.log(`[useCarData] Realtime update received:`, payload);
        queryClient.invalidateQueries({ queryKey: ['cars'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isDemoMode, userDataLoaded, user?.id, queryClient]);

  return {
    cars,
    setCars,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch cars') : null,
    fetchCars: refetch,
    createCar,
  };
};
