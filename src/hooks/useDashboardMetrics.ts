
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
    if (loading || vacationsLoading) {
      return {
        availableEmployees: { count: 0, total: 0, employees: [] },
        availableCars: { count: 0, total: 0, cars: [] },
        absentEmployees: { count: 0, employees: [] }
      };
    }

    // Calculate available employees (not fully booked, on vacation, or on leave)
    const availableEmployeesList = employees.filter(employee => {
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      return status.status === 'available' || status.status === 'partiallyBooked';
    }).map(employee => {
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      return {
        ...employee,
        availabilityStatus: status
      };
    });

    // Calculate available cars (not assigned to today's assignments)
    const assignedCarIds = new Set(
      assignments
        .filter(assignment => assignment.date === todayStr || assignment.assignment_date === todayStr)
        .flatMap(assignment => {
          const carIds = [];
          if (assignment.car_id) carIds.push(assignment.car_id);
          if (assignment.car_ids) carIds.push(...assignment.car_ids);
          return carIds;
        })
    );

    const availableCarsList = cars.filter(car => 
      car.is_available && !assignedCarIds.has(car.id)
    );

    // Calculate absent employees (on vacation or leave)
    const absentEmployeesList = employees.filter(employee => {
      const status = getEmployeeAvailabilityStatus(employee, today, assignments, vacations, t);
      return status.status === 'onVacation' || status.status === 'onLeave' || status.status === 'partialVacation';
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
    error
  };
};
