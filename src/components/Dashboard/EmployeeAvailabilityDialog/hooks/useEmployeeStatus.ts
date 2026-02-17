
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';

interface UseEmployeeStatusProps {
  employee: Employee;
  currentDate: Date;
  assignments: Assignment[];
  vacations: Vacation[];
  viewedDate: string;
}

export const useEmployeeStatus = ({
  employee,
  currentDate,
  assignments,
  vacations,
  viewedDate
}: UseEmployeeStatusProps) => {
  const { t } = useTranslation();

  if (import.meta.env.DEV) console.log(`[EmployeeStatus] Checking: ${employee.name} for ${viewedDate}`);
  
  const availabilityInfo = getEmployeeAvailabilityStatus(
    employee,
    currentDate,
    assignments,
    vacations,
    t
  );
  
  if (import.meta.env.DEV) console.log(`[EmployeeStatus] ${employee.name}: ${availabilityInfo.status}`);
  
  // Map the status to appropriate labels and colors for the dialog using standardized translation keys
  switch (availabilityInfo.status) {
    case 'available':
      return {
        status: 'available',
        label: t('employees.status.available'),
        color: 'bg-green-100 text-green-800 border-green-200',
        hasEndTimeAtSixteen: false
      };
    case 'partiallyBooked':
      return {
        status: 'partiallyAvailable',
        label: availabilityInfo.statusText, // This already contains the translated "Available after XX:XX" text
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        hasEndTimeAtSixteen: false
      };
    case 'fullyBooked':
      return {
        status: 'fullyBooked',
        label: t('employees.status.fullyBooked'),
        color: 'bg-red-100 text-red-800 border-red-200',
        hasEndTimeAtSixteen: availabilityInfo.availableAt === "16:00"
      };
    case 'onVacation':
      return {
        status: 'vacation',
        label: t('employees.status.onVacation'),
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        hasEndTimeAtSixteen: false
      };
    case 'partialVacation':
      return {
        status: 'partialVacation',
        label: availabilityInfo.statusText, // This will show the translated partial vacation text
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        hasEndTimeAtSixteen: false
      };
    case 'onLeave':
      return {
        status: 'leave',
        label: t('employees.status.onLeave'),
        color: 'bg-muted text-foreground border-border',
        hasEndTimeAtSixteen: false
      };
    default:
      return {
        status: 'unknown',
        label: t('employees.status.unknown'),
        color: 'bg-muted text-foreground border-border',
        hasEndTimeAtSixteen: false
      };
  }
};
