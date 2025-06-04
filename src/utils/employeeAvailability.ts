
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
  const checkResult = vacations.some(vacation => {
    if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
      return false;
    }
    
    const startDate = new Date(vacation.startDate);
    const endDate = new Date(vacation.endDate);
    
    // Normalize all dates to avoid time zone issues
    const normalizedSelectedDate = new Date(selectedDate);
    normalizedSelectedDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const isInRange = normalizedSelectedDate >= startDate && normalizedSelectedDate <= endDate;
    
    if (isInRange) {
      console.log(`[isEmployeeOnVacation] Employee ${employeeId} is on vacation on ${format(selectedDate, 'yyyy-MM-dd')}: vacation from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    }
    
    return isInRange;
  });
  
  return checkResult;
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
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  console.log(`[getEmployeeAvailabilityStatus] Checking employee: ${employee.name} for date: ${dateStr}`);
  
  // PRIORITY 1: Check if employee is on vacation FOR THIS SPECIFIC DATE
  const isOnVacationToday = isEmployeeOnVacation(employee.id, selectedDate, vacations);
  if (isOnVacationToday) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is on vacation on ${dateStr}`);
    return {
      status: 'onVacation',
      statusText: t('planner.onVacation'),
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }

  // PRIORITY 2: Check if employee is manually marked as on leave
  if (employee.onLeave) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is manually marked as on leave`);
    return {
      status: 'onLeave',
      statusText: t('employees.onLeave'),
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  }

  // Get assignments for this employee on the selected date
  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
  console.log(`[getEmployeeAvailabilityStatus] Target date string: ${targetDateStr}`);
  
  // Enhanced assignment filtering with better logging
  const employeeAssignments = assignments.filter(assignment => {
    const assignmentDateStr = assignment.date.includes('T') 
      ? assignment.date.split('T')[0] 
      : assignment.date;
    
    const isOnDate = assignmentDateStr === targetDateStr;
    
    let isAssigned = false;
    if (assignment.employees && Array.isArray(assignment.employees)) {
      isAssigned = assignment.employees.includes(employee.name);
    }
    
    const matches = isOnDate && isAssigned;
    if (matches) {
      console.log(`[getEmployeeAvailabilityStatus] Found assignment for ${employee.name}: ${assignment.title} on ${assignmentDateStr}`);
    }
    
    return matches;
  });

  console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} has ${employeeAssignments.length} assignments on ${targetDateStr}`);

  if (employeeAssignments.length === 0) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is available (no assignments)`);
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
    const isAtWorkdayEnd = normalizedEndTime === workdayEndTime;
    console.log(`[getEmployeeAvailabilityStatus] Assignment ${assignment.title} ends at ${normalizedEndTime}, workday ends at ${workdayEndTime}, matches: ${isAtWorkdayEnd}`);
    return isAtWorkdayEnd;
  });

  if (hasEndTimeAtWorkdayEnd) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is fully booked (ends at workday end)`);
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
  console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is partially booked, available after ${formattedTime}`);
  
  return {
    status: 'partiallyBooked',
    statusText: t('employees.availableAfter', { time: formattedTime }),
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    availableAt: latestEndTime
  };
};
