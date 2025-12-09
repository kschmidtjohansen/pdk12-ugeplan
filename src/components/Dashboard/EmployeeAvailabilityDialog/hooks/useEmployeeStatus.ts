import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { getEmployeeAvailabilityStatus, VacationDetails } from '@/utils/employeeAvailability';
import { useTranslation } from '@/context/TranslationContext';

interface UseEmployeeStatusProps {
  employee: Employee;
  currentDate: Date;
  assignments: Assignment[];
  vacations: Vacation[];
  viewedDate: string;
}

interface EmployeeStatusResult {
  status: string;
  label: string;
  color: string;
  hasEndTimeAtSixteen: boolean;
  vacationDetails?: VacationDetails;
}

export const useEmployeeStatus = ({
  employee,
  currentDate,
  assignments,
  vacations,
  viewedDate
}: UseEmployeeStatusProps): EmployeeStatusResult => {
  const { t } = useTranslation();

  console.log(`[EmployeeStatus] === CHECKING EMPLOYEE: ${employee.name} for ${viewedDate} ===`);
  
  const availabilityInfo = getEmployeeAvailabilityStatus(
    employee,
    currentDate,
    assignments,
    vacations,
    t
  );
  
  console.log(`[EmployeeStatus] Employee ${employee.name} status: ${availabilityInfo.status}, text: "${availabilityInfo.statusText}"`);
  
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
        label: availabilityInfo.statusText,
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
        hasEndTimeAtSixteen: false,
        vacationDetails: availabilityInfo.vacationDetails
      };
    case 'partialVacation':
      return {
        status: 'partialVacation',
        label: availabilityInfo.statusText,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        hasEndTimeAtSixteen: false,
        vacationDetails: availabilityInfo.vacationDetails
      };
    case 'onLeave':
      return {
        status: 'leave',
        label: t('employees.status.onLeave'),
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        hasEndTimeAtSixteen: false
      };
    default:
      return {
        status: 'unknown',
        label: t('employees.status.unknown'),
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        hasEndTimeAtSixteen: false
      };
  }
};
