
import { useMemo } from 'react';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { useCarData } from '@/hooks/car/useCarData';
import { useAssignments } from '@/hooks/useAssignments';
import { useVacationData } from './vacation/useVacationData';
import { useWarehouseData } from './warehouse/useWarehouseData';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useActiveTrainingsForDate } from '@/hooks/useActiveTrainings';
import { format } from 'date-fns';

export const useDashboardMetrics = (selectedDate?: string) => {
  const { employees, loading: employeesLoading, error: employeesError } = useEmployeeData();
  const { cars, loading: carsLoading, error: carsError } = useCarData();
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments();
  const { vacations, loading: vacationsLoading } = useVacationData();
  const { items: warehouseItems, loading: warehouseLoading } = useWarehouseData();
  const { t } = useTranslation();
  const { selectedSubDepartmentId } = useDepartment();
  const { effectiveRole } = useAuth();

  const metricDateStr = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const { trainingIds, trainingInfo, isLoading: trainingsLoading } = useActiveTrainingsForDate(metricDateStr);

  const metrics = useMemo(() => {
    const defaultMetrics = {
      availableEmployees: { count: 0, total: 0, employees: [] },
      availableCars: { count: 0, total: 0, cars: [] },
      absentEmployees: { count: 0, employees: [] },
      warehouseItems: { count: 0, items: [] }
    };

    if (employeesLoading || carsLoading || assignmentsLoading || vacationsLoading || warehouseLoading || trainingsLoading) {
      return defaultMetrics;
    }

    try {
      const metricDate = new Date(`${metricDateStr}T12:00:00`);
      // Defensive guards against undefined arrays
      const safeEmployees = employees || [];
      const safeAssignments = assignments || [];
      const safeCars = cars || [];
      const safeVacations = vacations || [];
      const safeWarehouseItems = warehouseItems || [];

      // Kun servicemedarbejdere tæller i dashboard-metrics som default.
      // Når en underafdeling er valgt, inkluderes også fugtteknikere og skadeledere.
      // Kun servicemedarbejdere tæller i dashboard-metrics som default.
      // Når en underafdeling er valgt, inkluderes også fugtteknikere og skadeledere
      // — men fugttekniker/servicemedarbejder selv ser altid kun servicemedarbejdere.
      const SUB_DEPT_ROLES = ['servicemedarbejder', 'fugttekniker', 'skadeleder'];
      const restrictToServicemedarbejder =
        effectiveRole === 'servicemedarbejder' || effectiveRole === 'fugttekniker';
      const isCountableEmployee = (e: typeof safeEmployees[number]) => {
        const roles = (e.roles && e.roles.length ? e.roles : [e.role]) as string[];
        if (restrictToServicemedarbejder) {
          return roles.includes('servicemedarbejder');
        }
        if (selectedSubDepartmentId) {
          return roles.some(r => SUB_DEPT_ROLES.includes(r));
        }
        return roles.includes('servicemedarbejder');
      };

      const countableEmployees = safeEmployees.filter(isCountableEmployee);

      // Total employees: count all active countable employees (not inactive)
      const totalEmployees = countableEmployees.filter(e => e.status !== 'inactive').length;

      // Calculate available employees (all active employees, not fully booked, on vacation, or on leave)
      const availableEmployeesList = countableEmployees.filter(employee => {
        if (employee.status === 'inactive') return false;
        if (trainingIds.has(employee.id)) return false;

        const status = getEmployeeAvailabilityStatus(employee, metricDate, safeAssignments, safeVacations, t);
        return status.status === 'available' || status.status === 'partiallyBooked';
      }).map(employee => {
        const status = getEmployeeAvailabilityStatus(employee, metricDate, safeAssignments, safeVacations, t);
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
            return assignmentDate === metricDateStr;
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

      // Total cars: ekskludér hjælpekøretøjer (trailere, miljøvogne m.m.)
      const nonAuxiliaryCars = safeCars.filter(car => (car as any).is_auxiliary !== true);
      const totalCars = nonAuxiliaryCars.length;
      
      const availableCarsList = nonAuxiliaryCars.filter(car => 
        car.is_available && 
        car.show_in_planner !== false && 
        !assignedCarIds.has(car.id)
      );

      // Calculate absent employees (on vacation or leave)
      const absentEmployeesList = countableEmployees.filter(employee => {
        if (trainingIds.has(employee.id)) return true;
        const status = getEmployeeAvailabilityStatus(employee, metricDate, safeAssignments, safeVacations, t);
        return status.status === 'onVacation' || status.status === 'onLeave' || status.status === 'partialVacation';
      }).map(employee => {
        const status = getEmployeeAvailabilityStatus(employee, metricDate, safeAssignments, safeVacations, t);
        const vacation = safeVacations.find(v =>
          v.user_id === employee.id && 
          v.status === 'approved' &&
          new Date(v.start_date) <= metricDate &&
          new Date(v.end_date) >= metricDate
        );
        const isOnTraining = trainingIds.has(employee.id);
        
        return {
          ...employee,
          availabilityStatus: status,
          vacation: vacation,
          onTraining: isOnTraining,
          training: isOnTraining ? trainingInfo.get(employee.id) : undefined
        };
      });

      // Calculate total warehouse quantity
      const totalWarehouseQuantity = safeWarehouseItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (import.meta.env.DEV) {
        const servicemedarbejdere = countableEmployees;
        const carsInPlanner = safeCars.filter(c => c.show_in_planner !== false);
        const todaysAssignments = safeAssignments.filter(assignment => {
          const assignmentDate = (assignment as any).date || (assignment as any).assignment_date;
          return assignmentDate === metricDateStr;
        });

        if (import.meta.env.DEV) console.log('[useDashboardMetrics] COMPREHENSIVE METRICS DEBUG', {
          raw_data: {
            total_employees: safeEmployees.length,
            active_employees: totalEmployees,
            servicemedarbejdere_count: servicemedarbejdere.length,
            total_cars: totalCars,
            cars_in_planner: carsInPlanner.length,
            total_assignments: safeAssignments.length,
            todays_assignments: todaysAssignments.length,
            assignedCarIds: Array.from(assignedCarIds)
          },
          calculated_metrics: {
            availableEmployees: availableEmployeesList.length,
            availableCars: availableCarsList.length,
            absentEmployees: absentEmployeesList.length,
            warehouseQuantity: totalWarehouseQuantity
          }
        });
      }

      return {
        availableEmployees: {
          count: availableEmployeesList.length,
          total: totalEmployees,
          employees: availableEmployeesList
        },
        availableCars: {
          count: availableCarsList.length,
          total: totalCars,
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
      if (import.meta.env.DEV) console.error('[useDashboardMetrics] Error computing metrics:', err);
      return defaultMetrics;
    }
  }, [employees, assignments, cars, vacations, warehouseItems, employeesLoading, carsLoading, assignmentsLoading, vacationsLoading, warehouseLoading, trainingsLoading, t, metricDateStr, selectedSubDepartmentId, effectiveRole, trainingIds, trainingInfo]);

  // Only show error if we have NO data at all (fatal error)
  const hasAnyData = (employees && employees.length > 0) || 
                      (assignments && assignments.length > 0) || 
                      (cars && cars.length > 0) ||
                      (warehouseItems && warehouseItems.length > 0) ||
                      (vacations && vacations.length > 0);
  
  const anyError = employeesError || carsError || assignmentsError;
  const derivedError = anyError && !hasAnyData ? anyError : null;

  return {
    metrics,
    loading: employeesLoading || carsLoading || assignmentsLoading || vacationsLoading || warehouseLoading || trainingsLoading,
    error: derivedError,
    assignments,
    vacations
  };
};
