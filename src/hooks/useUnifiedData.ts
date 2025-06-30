
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';

export const useUnifiedData = () => {
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees();
  const { cars, loading: carsLoading, error: carsError } = useCars();

  const loading = employeesLoading || carsLoading;
  const error = employeesError || carsError;

  console.log(`[useUnifiedData] Providing ${employees.length} employees and ${cars.length} cars`);

  return {
    employees,
    cars,
    loading,
    error
  };
};
