
import { useState, useEffect, useMemo } from 'react';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useEmployees } from '@/hooks/useEmployees';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';

interface UseEmployeeDialogDataProps {
  initialEmployees: Employee[];
  selectedDate: string;
  assignments: Assignment[];
  vacations: Vacation[];
}

export const useEmployeeDialogData = ({
  initialEmployees,
  selectedDate,
  assignments,
  vacations
}: UseEmployeeDialogDataProps) => {
  const { t } = useTranslation();
  const { employees: allEmployees } = useEmployees();
  const { effectiveRole } = useAuth();
  const [viewedDate, setViewedDate] = useState<string>(selectedDate);

  // Fugttekniker og servicemedarbejder må kun se servicemedarbejdere i dialogen,
  // også når en underafdeling er valgt og KPI-listen ellers ville inkludere
  // skadeleder/fugttekniker.
  const restrictToServicemedarbejder =
    effectiveRole === 'servicemedarbejder' || effectiveRole === 'fugttekniker';

  const isServicemedarbejder = (employee: Employee) => {
    const roles = (employee.roles && employee.roles.length ? employee.roles : [employee.role]) as string[];
    return roles.includes('servicemedarbejder');
  };

  // Update local state when selectedDate prop changes
  useEffect(() => {
    setViewedDate(selectedDate);
  }, [selectedDate]);

  // Convert viewedDate string to Date object
  const currentDate = useMemo(() => new Date(viewedDate + 'T12:00:00'), [viewedDate]);

  // HYBRID APPROACH: Use initial employees for original date, all service employees for navigated dates
  const employeesToShow = useMemo(() => {
    if (viewedDate === selectedDate) {
      const base = restrictToServicemedarbejder
        ? initialEmployees.filter(isServicemedarbejder)
        : initialEmployees;
      if (import.meta.env.DEV) console.log(`[EmployeeDialogData] Using pre-filtered employees (${base.length}) for original date ${selectedDate}`);
      return base;
    } else {
      const serviceEmployees = allEmployees.filter(isServicemedarbejder);
      if (import.meta.env.DEV) console.log(`[EmployeeDialogData] Using all service employees (${serviceEmployees.length}) for navigated date ${viewedDate}`);
      
      const availableEmployees = serviceEmployees.filter(employee => {
        const availabilityInfo = getEmployeeAvailabilityStatus(
          employee,
          currentDate,
          assignments,
          vacations,
          t
        );
        
        const isAvailable = availabilityInfo.status === 'available' || availabilityInfo.status === 'partiallyBooked';
        if (import.meta.env.DEV) console.log(`[EmployeeDialogData] Employee ${employee.name} for ${viewedDate}: status=${availabilityInfo.status}, available=${isAvailable}`);
        return isAvailable;
      });
      
      if (import.meta.env.DEV) console.log(`[EmployeeDialogData] Filtered available employees for ${viewedDate}: ${availableEmployees.length}`);
      return availableEmployees;
    }
  }, [viewedDate, selectedDate, initialEmployees, allEmployees, currentDate, assignments, vacations, t, restrictToServicemedarbejder]);

  return {
    viewedDate,
    setViewedDate,
    currentDate,
    employeesToShow
  };
};
