
import { useMemo } from 'react';
import { useEnhancedUnifiedData } from './useEnhancedUnifiedData';
import { useVacationData } from './vacation/useVacationData';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';

export const useDashboardMetrics = () => {
  const { employees, assignments, cars, loading, error } = useEnhancedUnifiedData();
  const { vacations, loading: vacationsLoading } = useVacationData();
  const { t } = useTranslation();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const metrics = useMemo(() => {
    console.log('[useDashboardMetrics] === METRICS CALCULATION DEBUG ===');
    console.log('[useDashboardMetrics] Loading states:', { loading, vacationsLoading });
    console.log('[useDashboardMetrics] Data counts:', { 
      employees: employees.length, 
      assignments: assignments.length, 
      vacations: vacations.length 
    });
    
    if (loading || vacationsLoading) {
      console.log('[useDashboardMetrics] Still loading, returning zeros');
      return {
        availableEmployees: { count: 0, total: 0, employees: [] },
        availableCars: { count: 0, total: 0, cars: [] },
        absentEmployees: { count: 0, employees: [] }
      };
    }

    console.log('[useDashboardMetrics] Processing employees...');
    console.log('[useDashboardMetrics] Employees data:', employees.map(e => ({
      name: e.name,
      role: e.role,
      onLeave: e.onLeave,
      id: e.id
    })));

    // Calculate available employees (servicemedarbejder only, not fully booked, on vacation, or on leave)
    const availableEmployeesList = employees.filter(employee => {
      // Only include servicemedarbejder role
      if (employee.role !== 'servicemedarbejder') {
        console.log(`[useDashboardMetrics] Skipping ${employee.name} - role: ${employee.role}`);
        return false;
      }
      
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      console.log(`[useDashboardMetrics] Employee ${employee.name} status:`, status);
      
      const isAvailable = status.status === 'available' || status.status === 'partiallyBooked';
      console.log(`[useDashboardMetrics] Employee ${employee.name} is available: ${isAvailable}`);
      
      return isAvailable;
    }).map(employee => {
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      return {
        ...employee,
        availabilityStatus: status
      };
    });

    console.log('[useDashboardMetrics] Available employees:', availableEmployeesList.length);

    // Calculate available cars (not assigned to today's assignments)
    const assignedCarIds = new Set(
      assignments
        .filter(assignment => assignment.date === todayStr)
        .flatMap(assignment => {
          const carIds = [];
          if (assignment.car) {
            // Handle car property which can be string or object
            if (typeof assignment.car === 'string') {
              carIds.push(assignment.car);
            } else if (assignment.car && typeof assignment.car === 'object' && 'id' in assignment.car) {
              carIds.push(assignment.car.id);
            }
          }
          if (assignment.cars) carIds.push(...assignment.cars);
          return carIds;
        })
    );

    const availableCarsList = cars.filter(car => 
      car.is_available && !assignedCarIds.has(car.id)
    );

    // Calculate absent employees (on vacation or leave)
    const absentEmployeesList = employees.filter(employee => {
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      const isAbsent = status.status === 'onVacation' || status.status === 'onLeave' || status.status === 'partialVacation';
      
      console.log(`[useDashboardMetrics] Employee ${employee.name} absent status: ${status.status}, isAbsent: ${isAbsent}`);
      
      return isAbsent;
    }).map(employee => {
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      const vacation = vacations.find(v => 
        v.user_id === employee.id && 
        v.status === 'approved' &&
        new Date(v.start_date) <= today &&
        new Date(v.end_date) >= today
      );
      
      return {
        ...employee,
        availabilityStatus: status,
        vacation: vacation
      };
    });

    console.log('[useDashboardMetrics] Final counts:', {
      available: availableEmployeesList.length,
      absent: absentEmployeesList.length,
      total: employees.length
    });

    return {
      availableEmployees: {
        count: availableEmployeesList.length,
        total: employees.length,
        employees: availableEmployeesList
      },
      availableCars: {
        count: availableCarsList.length,
        total: cars.length,
        cars: availableCarsList
      },
      absentEmployees: {
        count: absentEmployeesList.length,
        employees: absentEmployeesList
      }
    };
  }, [employees, assignments, cars, vacations, loading, vacationsLoading, t, today, todayStr]);

  return {
    metrics,
    loading: loading || vacationsLoading,
    error,
    assignments,
    vacations
  };
};
