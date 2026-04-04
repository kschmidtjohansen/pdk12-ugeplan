
import { useState, useEffect } from 'react';
import { unifiedDataService } from '@/services/data/unifiedDataService';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { isDemoNonHomeDepartment } from '@/constants/demo';

// Demo user constants for filtering
const DEMO_USER_EMAIL = 'test@polygongroup.com';
const DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';

interface UseUnifiedDataResult {
  employees: Employee[];
  assignments: Assignment[];
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUnifiedData = (): UseUnifiedDataResult => {
  const { isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async (filterDemoUser: boolean, departmentId: string | null) => {
    try {
      setLoading(true);
      setError(null);

      const deptId = departmentId || undefined;

      // In demo mode, return empty data for non-home departments
      const currentIsDemoMode = !filterDemoUser;
      if (isDemoNonHomeDepartment(currentIsDemoMode, departmentId)) {
        if (import.meta.env.DEV) console.log('[useUnifiedData] Non-home department in demo mode, returning empty');
        setEmployees([]);
        setAssignments([]);
        setCars([]);
        return;
      }

      const [employeesResult, assignmentsResult, carsResult] = await Promise.all([
        unifiedDataService.fetchEmployees(deptId),
        unifiedDataService.fetchAssignments(deptId),
        unifiedDataService.fetchCars(deptId)
      ]);

      if (employeesResult.error || assignmentsResult.error || carsResult.error) {
        const errors = [employeesResult.error, assignmentsResult.error, carsResult.error]
          .filter(Boolean)
          .join(', ');
        throw new Error(errors);
      }

      // Filter out demo user when not in demo mode
      let filteredEmployees = employeesResult.data;
      if (filterDemoUser) {
        filteredEmployees = employeesResult.data.filter(emp => 
          emp.email !== DEMO_USER_EMAIL && emp.id !== DEMO_USER_ID
        );
      }

      setEmployees(filteredEmployees);
      setAssignments(assignmentsResult.data);
      setCars(carsResult.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('[useUnifiedData] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    unifiedDataService.clearCache();
    await fetchAllData(!isDemoMode, selectedDepartmentId);
  };

  useEffect(() => {
    let isMounted = true;
    const filterDemoUser = !isDemoMode;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchAllData(filterDemoUser, selectedDepartmentId);
      }
    };

    // Set up realtime subscription for cars to get immediate updates
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleRealtimeChange = (table: string) => {
      if (!isMounted) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) {
          if (import.meta.env.DEV) console.log(`[useUnifiedData] Realtime change on ${table}, refetching...`);
          unifiedDataService.clearCache();
          loadData().catch(console.error);
        }
      }, 1000);
    };

    const channel = supabase
      .channel('unified-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, () => handleRealtimeChange('cars'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => handleRealtimeChange('profiles'))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useUnifiedData] Realtime channel error, falling back to existing data');
        }
      });

    loadData();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isDemoMode, selectedDepartmentId]);

  return {
    employees,
    assignments,
    cars,
    loading,
    error,
    refetch
  };
};
