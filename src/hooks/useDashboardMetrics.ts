
import { useMemo } from 'react';
import { useEnhancedUnifiedData } from './useEnhancedUnifiedData';
import { useVacationData } from './vacation/useVacationData';
import { useWarehouseData } from './warehouse/useWarehouseData';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';

export const useDashboardMetrics = () => {
  const { employees, assignments, cars, loading, error } = useEnhancedUnifiedData();
  const { vacations, loading: vacationsLoading } = useVacationData();
  const { items: warehouseItems, loading: warehouseLoading } = useWarehouseData();
  const { t } = useTranslation();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const metrics = useMemo(() => {
    const defaultMetrics = {
      availableEmployees: { count: 0, total: 0, employees: [] },
      availableCars: { count: 0, total: 0, cars: [] },
      absentEmployees: { count: 0, employees: [] },
      warehouseItems: { count: 0, items: [] }
    };

    if (loading || vacationsLoading || warehouseLoading) {
      return defaultMetrics;
    }

    try {
      // Defensive guards against undefined arrays
      const safeEmployees = employees || [];
      const safeAssignments = assignments || [];
      const safeCars = cars || [];
      const safeVacations = vacations || [];
      const safeWarehouseItems = warehouseItems || [];

      // Calculate available employees (servicemedarbejder only, not fully booked, on vacation, or on leave)
      const availableEmployeesList = safeEmployees.filter(employee => {
        // Only include servicemedarbejder role
        if (employee.role !== 'servicemedarbejder') return false;
        
        const status = getEmployeeAvailabilityStatus(employee, today, safeAssignments, safeVacations, t);
        return status.status === 'available' || status.status === 'partiallyBooked';
      }).map(employee => {
        const status = getEmployeeAvailabilityStatus(employee, today, safeAssignments, safeVacations, t);
        return {
          ...employee,
          availabilityStatus: status
        };
      });

      // Calculate available cars (not assigned to today's assignments)
      // Handle both date and assignment_date fields for demo/production compatibility
      const assignedCarIds = new Set(
        safeAssignments
          .filter(assignment => {
            const assignmentDate = (assignment as any).date || (assignment as any).assignment_date;
            return assignmentDate === todayStr;
          })
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

      const availableCarsList = safeCars.filter(car => 
        car.is_available && !assignedCarIds.has(car.id)
      );

      // Calculate absent employees (on vacation or leave)
      const absentEmployeesList = safeEmployees.filter(employee => {
        const status = getEmployeeAvailabilityStatus(employee, today, safeAssignments, safeVacations, t);
        return status.status === 'onVacation' || status.status === 'onLeave' || status.status === 'partialVacation';
      }).map(employee => {
        const status = getEmployeeAvailabilityStatus(employee, today, safeAssignments, safeVacations, t);
        const vacation = safeVacations.find(v =>
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

      // Calculate total warehouse quantity
      const totalWarehouseQuantity = safeWarehouseItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      return {
        availableEmployees: {
          count: availableEmployeesList.length,
          total: safeEmployees.length,
          employees: availableEmployeesList
        },
        availableCars: {
          count: availableCarsList.length,
          total: safeCars.length,
          cars: availableCarsList
        },
        absentEmployees: {
          count: absentEmployeesList.length,
          employees: absentEmployeesList
        },
        warehouseItems: {
          count: totalWarehouseQuantity,
          items: safeWarehouseItems
        }
      };
    } catch (err) {
      console.error('[useDashboardMetrics] Error computing metrics:', err);
      return defaultMetrics;
    }
  }, [employees, assignments, cars, vacations, warehouseItems, loading, vacationsLoading, warehouseLoading, t, todayStr]);

  // Only show error if we have NO data at all (fatal error)
  const hasAnyData = (employees && employees.length > 0) || 
                      (assignments && assignments.length > 0) || 
                      (cars && cars.length > 0) ||
                      (warehouseItems && warehouseItems.length > 0) ||
                      (vacations && vacations.length > 0);
  
  const derivedError = error && !hasAnyData ? error : null;

  return {
    metrics,
    loading: loading || vacationsLoading || warehouseLoading,
    error: derivedError,
    assignments,
    vacations
  };
};
