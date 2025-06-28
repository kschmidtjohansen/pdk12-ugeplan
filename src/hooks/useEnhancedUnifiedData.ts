
import { useState, useEffect, useCallback } from 'react';
import { enhancedUnifiedDataService } from '@/services/enhancedUnifiedDataService';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useToast } from '@/hooks/use-toast';

interface EnhancedDataState {
  employees: Employee[];
  assignments: Assignment[];
  cars: Car[];
  loading: {
    employees: boolean;
    assignments: boolean;
    cars: boolean;
  };
  errors: {
    employees: string | null;
    assignments: string | null;
    cars: string | null;
  };
  healthStatus: {
    employees: boolean;
    assignments: boolean;
    cars: boolean;
  };
}

export const useEnhancedUnifiedData = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<EnhancedDataState>({
    employees: [],
    assignments: [],
    cars: [],
    loading: {
      employees: true,
      assignments: true,
      cars: true
    },
    errors: {
      employees: null,
      assignments: null,
      cars: null
    },
    healthStatus: {
      employees: false,
      assignments: false,
      cars: false
    }
  });

  const fetchEmployees = useCallback(async () => {
    console.log('[useEnhancedUnifiedData] Fetching employees with comprehensive fix...');
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, employees: true },
      errors: { ...prev.errors, employees: null }
    }));

    const result = await enhancedUnifiedDataService.fetchEmployees();
    
    setState(prev => ({
      ...prev,
      employees: result.data,
      loading: { ...prev.loading, employees: false },
      errors: { ...prev.errors, employees: result.error },
      healthStatus: { ...prev.healthStatus, employees: result.healthCheck }
    }));

    if (result.error) {
      console.error('[useEnhancedUnifiedData] Employee fetch failed:', result.error);
      toast({
        title: 'Employee Data Error',
        description: `Failed to load employees: ${result.error}`,
        variant: 'destructive',
      });
    } else {
      console.log(`[useEnhancedUnifiedData] SUCCESS: ${result.data.length} employees loaded (cache: ${result.fromCache})`);
      if (!result.fromCache) {
        toast({
          title: 'Employee Data Loaded ✅',
          description: `Successfully loaded ${result.data.length} employees with fixed database policies`,
        });
      }
    }
  }, [toast]);

  const fetchAssignments = useCallback(async () => {
    console.log('[useEnhancedUnifiedData] Fetching assignments...');
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, assignments: true },
      errors: { ...prev.errors, assignments: null }
    }));

    const result = await enhancedUnifiedDataService.fetchAssignments();
    
    setState(prev => ({
      ...prev,
      assignments: result.data,
      loading: { ...prev.loading, assignments: false },
      errors: { ...prev.errors, assignments: result.error },
      healthStatus: { ...prev.healthStatus, assignments: result.healthCheck }
    }));

    if (result.error) {
      console.error('[useEnhancedUnifiedData] Assignment fetch failed:', result.error);
      toast({
        title: 'Assignment Data Error',
        description: `Failed to load assignments: ${result.error}`,
        variant: 'destructive',
      });
    } else {
      console.log(`[useEnhancedUnifiedData] SUCCESS: ${result.data.length} assignments loaded (cache: ${result.fromCache})`);
    }
  }, [toast]);

  const fetchCars = useCallback(async () => {
    console.log('[useEnhancedUnifiedData] Fetching cars...');
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, cars: true },
      errors: { ...prev.errors, cars: null }
    }));

    const result = await enhancedUnifiedDataService.fetchCars();
    
    setState(prev => ({
      ...prev,
      cars: result.data,
      loading: { ...prev.loading, cars: false },
      errors: { ...prev.errors, cars: result.error },
      healthStatus: { ...prev.healthStatus, cars: result.healthCheck }
    }));

    if (result.error) {
      console.error('[useEnhancedUnifiedData] Car fetch failed:', result.error);
      toast({
        title: 'Car Data Error',
        description: `Failed to load cars: ${result.error}`,
        variant: 'destructive',
      });
    } else {
      console.log(`[useEnhancedUnifiedData] SUCCESS: ${result.data.length} cars loaded (cache: ${result.fromCache})`);
    }
  }, [toast]);

  const refetchAll = useCallback(async () => {
    console.log('[useEnhancedUnifiedData] Refetching all data with enhanced service...');
    enhancedUnifiedDataService.clearCache();
    await Promise.all([
      fetchEmployees(),
      fetchAssignments(),
      fetchCars()
    ]);
  }, [fetchEmployees, fetchAssignments, fetchCars]);

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
    fetchAssignments();
    fetchCars();
  }, [fetchEmployees, fetchAssignments, fetchCars]);

  const isLoading = state.loading.employees || state.loading.assignments || state.loading.cars;
  const hasErrors = state.errors.employees || state.errors.assignments || state.errors.cars;
  const isHealthy = state.healthStatus.employees && state.healthStatus.assignments && state.healthStatus.cars;

  return {
    ...state,
    isLoading,
    hasErrors,
    isHealthy,
    refetchAll,
    fetchEmployees,
    fetchAssignments,
    fetchCars,
    serviceStatus: enhancedUnifiedDataService.getStatus()
  };
};
