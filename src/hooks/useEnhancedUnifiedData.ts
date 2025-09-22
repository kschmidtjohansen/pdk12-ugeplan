
import { useState, useEffect } from 'react';
import { enhancedUnifiedDataService } from '@/services/enhancedUnifiedDataService';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useAuth } from '@/context/AuthContext';
import { reconcileAssignmentEmployeeNames } from '@/utils/people';

interface UseEnhancedUnifiedDataResult {
  employees: Employee[];
  assignments: Assignment[];
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fromCache: boolean;
  healthCheck: boolean;
  // Add the missing properties that components expect
  isLoading: boolean;
  hasErrors: boolean;
  isHealthy: boolean;
}

export const useEnhancedUnifiedData = (): UseEnhancedUnifiedDataResult => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [healthCheck, setHealthCheck] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesResult, assignmentsResult, carsResult] = await Promise.all([
        enhancedUnifiedDataService.fetchEmployees(user?.email),
        enhancedUnifiedDataService.fetchAssignments(user?.email),
        enhancedUnifiedDataService.fetchCars()
      ]);

      if (employeesResult.error || assignmentsResult.error || carsResult.error) {
        const errors = [employeesResult.error, assignmentsResult.error, carsResult.error]
          .filter(Boolean)
          .join(', ');
        throw new Error(errors);
      }

      setEmployees(employeesResult.data);
      const reconciledAssignments = (assignmentsResult.data || []).map(a => 
        reconcileAssignmentEmployeeNames(a, employeesResult.data || [])
      );
      setAssignments(reconciledAssignments);
      setCars(carsResult.data);
      setFromCache(employeesResult.fromCache || assignmentsResult.fromCache || carsResult.fromCache);
      setHealthCheck(employeesResult.healthCheck && assignmentsResult.healthCheck && carsResult.healthCheck);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      setHealthCheck(false);
      console.error('[useEnhancedUnifiedData] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    enhancedUnifiedDataService.clearCache();
    // Also clear the enhanced data fetching cache
    enhancedDataFetching.clearCache('employees');
    await fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    employees,
    assignments,
    cars,
    loading,
    error,
    refetch,
    fromCache,
    healthCheck,
    // Map to expected properties
    isLoading: loading,
    hasErrors: !!error,
    isHealthy: healthCheck
  };
};
