
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { format } from 'date-fns';

export type EmployeeAvailabilityStatus = 'available' | 'partiallyBooked' | 'fullyBooked' | 'onLeave' | 'onVacation';

export interface EmployeeAvailabilityInfo {
  status: EmployeeAvailabilityStatus;
  statusText: string;
  badgeColor: string;
  availableAt?: string;
}

// Helper function to check if an employee is on vacation for a specific date
export const isEmployeeOnVacation = (employeeId: string, selectedDate: Date, vacations: Vacation[]): boolean => {
  return vacations.some(vacation => {
    if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
      return false;
    }
    
    const startDate = new Date(vacation.startDate);
    const endDate = new Date(vacation.endDate);
    
    selectedDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return selectedDate >= startDate && selectedDate <= endDate;
  });
};

// Helper function to normalize time
const normalizeTime = (time: string): string => {
  if (!time) return '';
  
  // Remove seconds if present (HH:MM:SS -> HH:MM)
  if (time.length === 8 && time.includes(':')) {
    time = time.substring(0, 5);
  }
  
  // Ensure we have HH:MM format
  if (time.length === 5 && time.includes(':')) {
    return time;
  }
  
  return time.trim();
};

export const getEmployeeAvailabilityStatus = (
  employee: Employee,
  selectedDate: Date,
  assignments: Assignment[],
  vacations: Vacation[],
  t: (key: string, params?: any) => string
): EmployeeAvailabilityInfo => {
  // Check if employee is on leave
  if (employee.onLeave) {
    return {
      status: 'onLeave',
      statusText: t('employees.onLeave'),
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  }

  // Check if employee is on vacation
  if (isEmployeeOnVacation(employee.id, selectedDate, vacations)) {
    return {
      status: 'onVacation',
      statusText: t('planner.onVacation'),
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }

  // Get assignments for this employee on the selected date
  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
  const employeeAssignments = assignments.filter(assignment => {
    const assignmentDateStr = assignment.date.includes('T') 
      ? assignment.date.split('T')[0] 
      : assignment.date;
    
    const isOnDate = assignmentDateStr === targetDateStr;
    const isAssigned = assignment.employees && assignment.employees.includes(employee.name);
    
    return isOnDate && isAssigned;
  });

  if (employeeAssignments.length === 0) {
    return {
      status: 'available',
      statusText: t('dashboard.available'),
      badgeColor: 'bg-green-100 text-green-800 border-green-200'
    };
  }

  // Check if employee ends at exactly workday end time (16:00 or 15:30 on Friday)
  const dayOfWeek = selectedDate.getDay(); // 0=Sunday, 5=Friday
  const workdayEndTime = dayOfWeek === 5 ? "15:30" : "16:00";
  
  const hasEndTimeAtWorkdayEnd = employeeAssignments.some(assignment => {
    const normalizedEndTime = normalizeTime(assignment.toTime);
    return normalizedEndTime === workdayEndTime;
  });

  if (hasEndTimeAtWorkdayEnd) {
    return {
      status: 'fullyBooked',
      statusText: t('employees.fullyBooked'),
      badgeColor: 'bg-red-100 text-red-800 border-red-200'
    };
  }

  // Get the latest end time for partially booked status
  let latestEndTime = "00:00";
  employeeAssignments.forEach(assignment => {
    const normalizedTime = normalizeTime(assignment.toTime);
    if (normalizedTime > latestEndTime) {
      latestEndTime = normalizedTime;
    }
  });

  const formattedTime = latestEndTime.substring(0, 5);
  return {
    status: 'partiallyBooked',
    statusText: t('employees.availableAfter', { time: formattedTime }),
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    availableAt: latestEndTime
  };
};
