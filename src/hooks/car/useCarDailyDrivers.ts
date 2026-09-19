import { useMemo } from 'react';
import { format } from 'date-fns';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';

/**
 * Maps car id -> names of the people driving it today (based on today's
 * assignments in the active department). Presentation only — no extra queries
 * beyond the assignments the department already loads.
 */
export const useCarDailyDrivers = (): Map<string, string[]> => {
  const { assignments } = useAssignmentDataOptimized();

  return useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const map = new Map<string, string[]>();

    assignments
      .filter(a => a.date === today)
      .forEach(assignment => {
        const carIds = new Set<string>();
        (assignment.cars || []).forEach(id => id && carIds.add(id));
        if (typeof assignment.car === 'string' && assignment.car) carIds.add(assignment.car);
        else if (assignment.car && typeof assignment.car === 'object') carIds.add(assignment.car.id);

        if (carIds.size === 0) return;

        const names = new Set<string>();
        assignment.assignedEmployees?.forEach(emp => emp.name && names.add(emp.name));
        if (names.size === 0 && Array.isArray(assignment.employees)) {
          assignment.employees.forEach(name => {
            if (typeof name === 'string' && name.includes(' ')) names.add(name);
          });
        }
        if (names.size === 0 && assignment.responsibleUser?.name) {
          names.add(assignment.responsibleUser.name);
        }
        if (names.size === 0) return;

        carIds.forEach(carId => {
          const existing = map.get(carId) ?? [];
          names.forEach(name => {
            if (!existing.includes(name)) existing.push(name);
          });
          map.set(carId, existing);
        });
      });

    return map;
  }, [assignments]);
};
