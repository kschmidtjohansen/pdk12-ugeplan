
import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/services/unifiedDataService';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

interface UnifiedDataState {
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
  fromCache: {
    employees: boolean;
    assignments: boolean;
    cars: boolean;
  };
}

export const useUnifiedData = (includeUnpublishedAssignments: boolean = false) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [state, setState] = useState<UnifiedDataState>({
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
    fromCache: {
      employees: false,
      assignments: false,
      cars: false
    }
  });

  const fetchEmployees = useCallback(async () => {
    console.log('[useUnifiedData] Fetching employees...');
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, employees: true },
      errors: { ...prev.errors, employees: null }
    }));

    const result = await unifiedDataService.fetchEmployees();
    
    setState(prev => ({
      ...prev,
      employees: result.data,
      loading: { ...prev.loading, employees: false },
      errors: { ...prev.errors, employees: result.error },
      fromCache: { ...prev.fromCache, employees: result.fromCache }
    }));

    if (result.error && !result.fromCache) {
      toast({
        title: t('common.error') || 'Error',
        description: `Failed to load employees: ${result.error}`,
        variant: 'destructive',
      });
    }

    console.log(`[useUnifiedData] Employees loaded: ${result.data.length} (from cache: ${result.fromCache})`);
  }, [toast, t]);

  const fetchAssignments = useCallback(async () => {
    console.log('[useUnifiedData] Fetching assignments...');
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, assignments: true },
      errors: { ...prev.errors, assignments: null }
    }));

    const result = await unifiedDataService.fetchAssignments(includeUnpublishedAssignments);
    
    setState(prev => ({
      ...prev,
      assignments: result.data,
      loading: { ...prev.loading, assignments: false },
      errors: { ...prev.errors, assignments: result.error },
      fromCache: { ...prev.fromCache, assignments: result.fromCache }
    }));

    if (result.error && !result.fromCache) {
      toast({
        title: t('common.error') || 'Error',
        description: `Failed to load assignments: ${result.error}`,
        variant: 'destructive',
      });
    }

    console.log(`[useUnifiedData] Assignments loaded: ${result.data.length} (from cache: ${result.fromCache})`);
  }, [includeUnpublishedAssignments, toast, t]);

  const fetchCars = useCallback(async () => {
    console.log('[useUnifiedData] Fetching cars...');
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, cars: true },
      errors: { ...prev.errors, cars: null }
    }));

    const result = await unifiedDataService.fetchCars();
    
    setState(prev => ({
      ...prev,
      cars: result.data,
      loading: { ...prev.loading, cars: false },
      errors: { ...prev.errors, cars: result.error },
      fromCache: { ...prev.fromCache, cars: result.fromCache }
    }));

    if (result.error && !result.fromCache) {
      toast({
        title: t('common.error') || 'Error',
        description: `Failed to load cars: ${result.error}`,
        variant: 'destructive',
      });
    }

    console.log(`[useUnifiedData] Cars loaded: ${result.data.length} (from cache: ${result.fromCache})`);
  }, [toast, t]);

  const refetchAll = useCallback(async () => {
    console.log('[useUnifiedData] Refetching all data...');
    unifiedDataService.clearCache();
    await Promise.all([
      fetchEmployees(),
      fetchAssignments(),
      fetchCars()
    ]);
  }, [fetchEmployees, fetchAssignments, fetchCars]);

  const resetCircuitBreakers = useCallback(() => {
    console.log('[useUnifiedData] Resetting all circuit breakers...');
    unifiedDataService.resetAllCircuitBreakers();
    toast({
      title: t('common.success') || 'Success',
      description: 'Circuit breakers reset. You can try loading data again.',
    });
  }, [toast, t]);

  const checkSystemHealth = useCallback(async () => {
    console.log('[useUnifiedData] Checking system health...');
    const health = await unifiedDataService.checkSystemHealth();
    
    toast({
      title: 'System Health Check',
      description: `Status: ${health.status || 'checked'}. See console for details.`,
    });
    
    return health;
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
    fetchAssignments();
    fetchCars();
  }, [fetchEmployees, fetchAssignments, fetchCars]);

  const isLoading = state.loading.employees || state.loading.assignments || state.loading.cars;
  const hasErrors = state.errors.employees || state.errors.assignments || state.errors.cars;

  return {
    ...state,
    isLoading,
    hasErrors,
    refetchAll,
    fetchEmployees,
    fetchAssignments,
    fetchCars,
    resetCircuitBreakers,
    checkSystemHealth,
    serviceStatus: unifiedDataService.getStatus()
  };
};
