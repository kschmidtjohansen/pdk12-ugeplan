
import { useState, useEffect, useMemo } from 'react';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useEmployees } from '@/hooks/useEmployees';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';

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
  const [viewedDate, setViewedDate] = useState<string>(selectedDate);

  // Update local state when selectedDate prop changes
  useEffect(() => {
    setViewedDate(selectedDate);
  }, [selectedDate]);

  // Convert viewedDate string to Date object
  const currentDate = useMemo(() => new Date(viewedDate + 'T12:00:00'), [viewedDate]);

  // HYBRID APPROACH: Use initial employees for original date, all service employees for navigated dates
  const employeesToShow = useMemo(() => {
    if (viewedDate === selectedDate) {
      if (import.meta.env.DEV) console.log(`[EmployeeDialogData] Using pre-filtered employees (${initialEmployees.length}) for original date ${selectedDate}`);
      return initialEmployees;
    } else {
      const serviceEmployees = allEmployees.filter(employee => employee.role === 'servicemedarbejder');
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
  }, [viewedDate, selectedDate, initialEmployees, allEmployees, currentDate, assignments, vacations, t]);

  return {
    viewedDate,
    setViewedDate,
    currentDate,
    employeesToShow
  };
};
