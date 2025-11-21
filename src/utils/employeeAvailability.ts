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
  console.log(`[getEmployeeVacationStatus] Checking vacation for employee ${employeeId} on ${format(selectedDate, 'yyyy-MM-dd')}`);
  
  const applicableVacation = vacations.find(vacation => {
    if (vacation.user_id !== employeeId || vacation.status !== 'approved') {
      return false;
    }
    
    // Ensure we're working with Date objects
    const startDate = new Date(vacation.start_date);
    const endDate = new Date(vacation.end_date);
    
    // Normalize all dates to avoid time zone issues
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

  console.log(`[getEmployeeVacationStatus] Found vacation:`, {
    id: applicableVacation.id,
    request_type: applicableVacation.request_type,
    start_time: applicableVacation.start_time,
    end_time: applicableVacation.end_time
  });

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
  
  // Aggressive whitespace trimming
  time = time.trim();
  
  // Remove seconds explicitly: "16:00:00" -> "16:00"
  time = time.replace(/:\d{2}$/, '');
  
  // Additional cleanup for any remaining whitespace
  time = time.replace(/\s+/g, '');
  
  // Ensure we have HH:MM format
  if (time.length === 5 && time.includes(':')) {
    return time;
  }
  
  // Log warning for unexpected formats
  if (time.length !== 5 || !time.includes(':')) {
    console.warn(`[normalizeTime] Unexpected time format: "${time}"`);
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
  const dayOfWeek = selectedDate.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday
  
  // Friday (5) ends at 15:30, Monday-Thursday (1-4) end at 16:00
  if (dayOfWeek === 5) {
    return "15:30";
  } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    return "16:00";
  }
  
  // Default to 16:00 for other days (though work days are typically Mon-Fri)
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
  console.log(`[getEmployeeAvailabilityStatus] Checking employee: ${employee.name} (${employee.id}) for date: ${dateStr}`);
  
  // PRIORITY 0: Check if employee is on sick leave (NEW!)
  if (employee.isSick) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is on sick leave`);
    return {
      status: 'onLeave',
      statusText: 'Sygemeldt',
      badgeColor: 'bg-red-100 text-red-800 border-red-200'
    };
  }
  
  // PRIORITY 1: Check vacation status with detailed information
  const vacationStatus = getEmployeeVacationStatus(employee.id, selectedDate, vacations);
  
  if (vacationStatus.isOnVacation) {
    if (vacationStatus.vacationType === 'full_day') {
      console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is on full day vacation on ${dateStr}`);
      return {
        status: 'onVacation',
        statusText: t('employees.status.onVacation'),
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (vacationStatus.vacationType === 'partial_day' && vacationStatus.startTime) {
      const formattedStartTime = normalizeTime(vacationStatus.startTime);
      console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is on partial vacation from ${formattedStartTime} on ${dateStr}`);
      return {
        status: 'partialVacation',
        statusText: t('vacation.offFrom', { time: formattedStartTime }),
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    }
  }

  // PRIORITY 2: Check if employee is manually marked as on leave
  if (employee.onLeave) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is manually marked as on leave`);
    return {
      status: 'onLeave',
      statusText: t('employees.status.onLeave'),
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  }

  // Get assignments for this employee on the selected date
  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
  console.log(`[getEmployeeAvailabilityStatus] Target date string: ${targetDateStr}`);
  console.log(`[getEmployeeAvailabilityStatus] Total assignments to check: ${assignments.length}`);
  
  // Enhanced assignment filtering with better logging
  const employeeAssignments = assignments.filter(assignment => {
    const assignmentDateStr = assignment.date.includes('T') 
      ? assignment.date.split('T')[0] 
      : assignment.date;
    
    const isOnDate = assignmentDateStr === targetDateStr;
    
    let isAssigned = false;
    const normalizedEmployees = normalizeEmployees(assignment.employees);
    if (normalizedEmployees && normalizedEmployees.length > 0) {
      // Check if the employee is in the assignment by name OR by ID
      isAssigned = normalizedEmployees.includes(employee.name) || normalizedEmployees.includes(employee.id);
    }
    
    const matches = isOnDate && isAssigned;
    
    console.log(`[getEmployeeAvailabilityStatus] Assignment check:`, {
      assignmentId: assignment.id,
      assignmentDate: assignmentDateStr,
      assignmentEmployees: normalizedEmployees,
      isOnDate,
      isAssigned,
      matches,
      title: assignment.title || assignment.location
    });
    
    return matches;
  });

  console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} has ${employeeAssignments.length} assignments on ${targetDateStr}`);

  if (employeeAssignments.length === 0) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is available (no assignments)`);
    return {
      status: 'available',
      statusText: t('employees.status.available'),
      badgeColor: 'bg-green-100 text-green-800 border-green-200'
    };
  }

  // Get the correct workday end time based on the day of the week
  const workdayEndTime = getWorkdayEndTime(selectedDate);
  const workdayStartTime = "08:00";
  console.log(`[getEmployeeAvailabilityStatus] Workday for ${dateStr}: ${workdayStartTime} - ${workdayEndTime}`);
  
  // Calculate coverage - get earliest start and latest end time
  const latestEndTime = getLatestEndTime(employeeAssignments);
  const earliestStartTime = getEarliestStartTime(employeeAssignments);
  
  console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} assignments span: ${earliestStartTime} - ${latestEndTime}`);
  
  // Log all assignment times for debugging
  employeeAssignments.forEach(assignment => {
    console.log(`[getEmployeeAvailabilityStatus] Assignment "${assignment.title || assignment.location}": ${normalizeTime(assignment.fromTime)} - ${normalizeTime(assignment.toTime)}`);
  });
  
  // Check if assignments cover the full workday (with 30-minute tolerance)
  // Employee is fully booked if:
  // 1. They start at or before 08:30 AND
  // 2. They end at or after (workday end - 30 minutes)
  const toleranceThreshold = subtractMinutes(workdayEndTime, 30);
  const startsEarlyEnough = compareTimeStrings(earliestStartTime, "08:30") <= 0;
  const endsLateEnough = compareTimeStrings(latestEndTime, toleranceThreshold) >= 0;
  
  console.log(`[getEmployeeAvailabilityStatus] Fully booked check:`, {
    earliestStartTime,
    latestEndTime,
    workdayEndTime,
    toleranceThreshold,
    startsEarlyEnough: `${earliestStartTime} <= 08:30 = ${startsEarlyEnough}`,
    endsLateEnough: `${latestEndTime} >= ${toleranceThreshold} = ${endsLateEnough}`
  });
  
  if (startsEarlyEnough && endsLateEnough) {
    console.log(`[getEmployeeAvailabilityStatus] ✅ Employee ${employee.name} is FULLY BOOKED (covers full workday with tolerance)`);
    return {
      status: 'fullyBooked',
      statusText: t('employees.status.fullyBooked'),
      badgeColor: 'bg-red-100 text-red-800 border-red-200'
    };
  }
  
  // Employee is partially booked - show when they're available
  const formattedTime = latestEndTime.substring(0, 5);
  console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is PARTIALLY BOOKED, available after ${formattedTime}`);
  
  return {
    status: 'partiallyBooked',
    statusText: t('employees.availableAfter', { time: formattedTime }),
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    availableAt: latestEndTime
  };
};