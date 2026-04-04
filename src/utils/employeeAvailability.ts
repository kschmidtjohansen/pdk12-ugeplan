import { Employee } from '@/types/employee';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { format } from 'date-fns';

export type EmployeeAvailabilityStatus = 'available' | 'partiallyBooked' | 'fullyBooked' | 'onLeave' | 'onVacation' | 'partialVacation';

export interface EmployeeAvailabilityInfo {
  status: EmployeeAvailabilityStatus;
  statusText: string;
  badgeColor: string;
  availableAt?: string;
}

export interface EmployeeVacationInfo {
  isOnVacation: boolean;
  vacationType: 'none' | 'full_day' | 'partial_day';
  startTime?: string;
  endTime?: string;
  vacation?: Vacation;
}

// Enhanced function to get detailed vacation information
export const getEmployeeVacationStatus = (employeeId: string, selectedDate: Date, vacations: Vacation[]): EmployeeVacationInfo => {
  const applicableVacation = vacations.find(vacation => {
    if (vacation.user_id !== employeeId || vacation.status !== 'approved') {
      return false;
    }
    
    const startDate = new Date(vacation.start_date);
    const endDate = new Date(vacation.end_date);
    
    const normalizedSelectedDate = new Date(selectedDate);
    normalizedSelectedDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return normalizedSelectedDate >= startDate && normalizedSelectedDate <= endDate;
  });

  if (!applicableVacation) {
    return {
      isOnVacation: false,
      vacationType: 'none'
    };
  }

  if (applicableVacation.request_type === 'partial_day' && applicableVacation.start_time && applicableVacation.end_time) {
    return {
      isOnVacation: true,
      vacationType: 'partial_day',
      startTime: applicableVacation.start_time,
      endTime: applicableVacation.end_time,
      vacation: applicableVacation
    };
  }

  return {
    isOnVacation: true,
    vacationType: 'full_day',
    vacation: applicableVacation
  };
};

// Helper function to check if an employee is on vacation for a specific date (legacy compatibility)
export const isEmployeeOnVacation = (employeeId: string, selectedDate: Date, vacations: Vacation[]): boolean => {
  const vacationStatus = getEmployeeVacationStatus(employeeId, selectedDate, vacations);
  return vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day';
};

// Helper function to normalize time to HH:MM format
const normalizeTime = (time: string): string => {
  if (!time) return '';
  
  time = time.trim();
  time = time.replace(/:\d{2}$/, '');
  time = time.replace(/\s+/g, '');
  
  if (time.length === 5 && time.includes(':')) {
    return time;
  }
  
  if (time.length !== 5 || !time.includes(':')) {
    if (import.meta.env.DEV) console.warn(`[normalizeTime] Unexpected time format: "${time}"`);
  }
  
  return time;
};

// Helper function to get the latest end time from assignments
const getLatestEndTime = (assignments: Assignment[]): string => {
  let latestEndTime = "00:00";
  assignments.forEach(assignment => {
    const normalizedTime = normalizeTime(assignment.toTime);
    if (compareTimeStrings(normalizedTime, latestEndTime) > 0) {
      latestEndTime = normalizedTime;
    }
  });
  return latestEndTime;
};

// Helper function to get the earliest start time from assignments
const getEarliestStartTime = (assignments: Assignment[]): string => {
  let earliestStartTime = "23:59";
  assignments.forEach(assignment => {
    const normalizedTime = normalizeTime(assignment.fromTime);
    if (compareTimeStrings(normalizedTime, earliestStartTime) < 0) {
      earliestStartTime = normalizedTime;
    }
  });
  return earliestStartTime;
};

// Helper function to subtract minutes from a time string
const subtractMinutes = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins - minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

// Helper function to compare time strings robustly
const compareTimeStrings = (time1: string, time2: string): number => {
  const normalize = (t: string) => normalizeTime(t).replace(':', '');
  const num1 = parseInt(normalize(time1), 10);
  const num2 = parseInt(normalize(time2), 10);
  return num1 - num2;
};

// Helper function to determine workday end time based on day of week
const getWorkdayEndTime = (selectedDate: Date): string => {
  const dayOfWeek = selectedDate.getDay();
  
  if (dayOfWeek === 5) {
    return "15:30";
  } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    return "16:00";
  }
  
  return "16:00";
};

export const getEmployeeAvailabilityStatus = (
  employee: Employee,
  selectedDate: Date,
  assignments: Assignment[],
  vacations: Vacation[],
  t: (key: string, params?: any) => string
): EmployeeAvailabilityInfo => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // PRIORITY 1: Check vacation status with detailed information
  const vacationStatus = getEmployeeVacationStatus(employee.id, selectedDate, vacations);
  
  if (vacationStatus.isOnVacation) {
    if (vacationStatus.vacationType === 'full_day') {
      return {
        status: 'onVacation',
        statusText: t('employees.status.onVacation'),
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (vacationStatus.vacationType === 'partial_day' && vacationStatus.startTime) {
      const formattedStartTime = normalizeTime(vacationStatus.startTime);
      return {
        status: 'partialVacation',
        statusText: t('vacation.offFrom', { time: formattedStartTime }),
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    }
  }

  // PRIORITY 2: Check if employee is manually marked as on leave
  if (employee.onLeave) {
    return {
      status: 'onLeave',
      statusText: t('employees.status.onLeave'),
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  }

  // Get assignments for this employee on the selected date
  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const employeeAssignments = assignments.filter(assignment => {
    const assignmentDateStr = assignment.date.includes('T') 
      ? assignment.date.split('T')[0] 
      : assignment.date;
    
    const isOnDate = assignmentDateStr === targetDateStr;
    
    let isAssigned = false;
    const normalizedEmployees = normalizeEmployees(assignment.employees);
    if (normalizedEmployees && normalizedEmployees.length > 0) {
      isAssigned = normalizedEmployees.includes(employee.name) || normalizedEmployees.includes(employee.id);
    }
    
    return isOnDate && isAssigned;
  });

  if (employeeAssignments.length === 0) {
    return {
      status: 'available',
      statusText: t('employees.status.available'),
      badgeColor: 'bg-green-100 text-green-800 border-green-200'
    };
  }

  // Get the correct workday end time based on the day of the week
  const workdayEndTime = getWorkdayEndTime(selectedDate);
  
  // Calculate coverage
  const latestEndTime = getLatestEndTime(employeeAssignments);
  const earliestStartTime = getEarliestStartTime(employeeAssignments);
  
  // Check if assignments cover the full workday (with 30-minute tolerance)
  const toleranceThreshold = subtractMinutes(workdayEndTime, 30);
  const startsEarlyEnough = compareTimeStrings(earliestStartTime, "08:30") <= 0;
  const endsLateEnough = compareTimeStrings(latestEndTime, toleranceThreshold) >= 0;
  
  if (startsEarlyEnough && endsLateEnough) {
    return {
      status: 'fullyBooked',
      statusText: t('employees.status.fullyBooked'),
      badgeColor: 'bg-red-100 text-red-800 border-red-200'
    };
  }
  
  // Employee is partially booked - show when they're available
  const formattedTime = latestEndTime.substring(0, 5);
  
  return {
    status: 'partiallyBooked',
    statusText: t('employees.availableAfter', { time: formattedTime }),
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    availableAt: latestEndTime
  };
};
