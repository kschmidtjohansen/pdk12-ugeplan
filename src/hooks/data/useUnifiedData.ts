
import { useState, useEffect } from 'react';
import { unifiedDataService } from '@/services/data/unifiedDataService';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async (filterDemoUser: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const [employeesResult, assignmentsResult, carsResult] = await Promise.all([
        unifiedDataService.fetchEmployees(),
        unifiedDataService.fetchAssignments(),
        unifiedDataService.fetchCars()
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
    await fetchAllData(!isDemoMode);
  };

  useEffect(() => {
    let isMounted = true;
    const filterDemoUser = !isDemoMode;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchAllData(filterDemoUser);
      }
    };

    // Set up realtime subscription for cars to get immediate updates
    const channel = supabase
      .channel('unified-cars-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cars'
        },
        (payload) => {
          console.log('[useUnifiedData] Car realtime update received:', payload);
          // Clear cache and refetch when cars change
          if (isMounted) {
            unifiedDataService.clearCache();
            loadData().catch(console.error);
          }
        }
      )
      .subscribe();

    loadData();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isDemoMode]);

  return {
    employees,
    assignments,
    cars,
    loading,
    error,
    refetch
  };
};
