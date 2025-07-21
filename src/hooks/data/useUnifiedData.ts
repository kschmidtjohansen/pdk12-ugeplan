
import { useState, useEffect } from 'react';
import { unifiedDataService } from '@/services/data/unifiedDataService';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

interface UseUnifiedDataResult {
  employees: Employee[];
  assignments: Assignment[];
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUnifiedData = (): UseUnifiedDataResult => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
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

      setEmployees(employeesResult.data);
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
    refetch
  };
};
