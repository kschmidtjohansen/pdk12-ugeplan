
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
  console.log(`[getEmployeeAvailabilityStatus] === DEBUGGING EMPLOYEE: ${employee.name} ===`);
  console.log(`[getEmployeeAvailabilityStatus] Selected date:`, selectedDate);
  console.log(`[getEmployeeAvailabilityStatus] Employee details:`, {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    onLeave: employee.onLeave
  });
  console.log(`[getEmployeeAvailabilityStatus] Total assignments passed:`, assignments.length);
  console.log(`[getEmployeeAvailabilityStatus] All assignments:`, assignments.map(a => ({
    id: a.id,
    date: a.date,
    location: a.location,
    employees: a.employees,
    employeeCount: a.employees?.length || 0
  })));

  // Check if employee is on leave
  if (employee.onLeave) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is on leave`);
    return {
      status: 'onLeave',
      statusText: t('employees.onLeave'),
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  }

  // Check if employee is on vacation
  if (isEmployeeOnVacation(employee.id, selectedDate, vacations)) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is on vacation`);
    return {
      status: 'onVacation',
      statusText: t('planner.onVacation'),
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }

  // Get assignments for this employee on the selected date
  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
  console.log(`[getEmployeeAvailabilityStatus] Target date string:`, targetDateStr);
  
  // Enhanced assignment filtering with detailed logging
  const employeeAssignments = assignments.filter(assignment => {
    console.log(`[getEmployeeAvailabilityStatus] Checking assignment:`, {
      id: assignment.id,
      date: assignment.date,
      location: assignment.location,
      employees: assignment.employees,
      employeesType: typeof assignment.employees,
      isEmployeesArray: Array.isArray(assignment.employees)
    });

    const assignmentDateStr = assignment.date.includes('T') 
      ? assignment.date.split('T')[0] 
      : assignment.date;
    
    const isOnDate = assignmentDateStr === targetDateStr;
    console.log(`[getEmployeeAvailabilityStatus] Date comparison:`, {
      assignmentDate: assignmentDateStr,
      targetDate: targetDateStr,
      isOnDate
    });
    
    let isAssigned = false;
    if (assignment.employees && Array.isArray(assignment.employees)) {
      isAssigned = assignment.employees.includes(employee.name);
      console.log(`[getEmployeeAvailabilityStatus] Employee assignment check:`, {
        employeeName: employee.name,
        assignmentEmployees: assignment.employees,
        isAssigned
      });
    } else {
      console.log(`[getEmployeeAvailabilityStatus] No valid employees array found in assignment`);
    }
    
    const shouldInclude = isOnDate && isAssigned;
    console.log(`[getEmployeeAvailabilityStatus] Assignment filter result:`, {
      assignmentId: assignment.id,
      location: assignment.location,
      shouldInclude
    });
    
    return shouldInclude;
  });

  console.log(`[getEmployeeAvailabilityStatus] Found ${employeeAssignments.length} assignments for employee ${employee.name} on ${targetDateStr}`);
  console.log(`[getEmployeeAvailabilityStatus] Employee assignments:`, employeeAssignments.map(a => ({
    id: a.id,
    location: a.location,
    fromTime: a.fromTime,
    toTime: a.toTime
  })));

  if (employeeAssignments.length === 0) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is AVAILABLE (no assignments)`);
    return {
      status: 'available',
      statusText: t('dashboard.available'),
      badgeColor: 'bg-green-100 text-green-800 border-green-200'
    };
  }

  // Check if employee ends at exactly workday end time (16:00 or 15:30 on Friday)
  const dayOfWeek = selectedDate.getDay(); // 0=Sunday, 5=Friday
  const workdayEndTime = dayOfWeek === 5 ? "15:30" : "16:00";
  console.log(`[getEmployeeAvailabilityStatus] Workday end time for day ${dayOfWeek}:`, workdayEndTime);
  
  const hasEndTimeAtWorkdayEnd = employeeAssignments.some(assignment => {
    const normalizedEndTime = normalizeTime(assignment.toTime);
    const isWorkdayEnd = normalizedEndTime === workdayEndTime;
    console.log(`[getEmployeeAvailabilityStatus] Assignment end time check:`, {
      assignmentId: assignment.id,
      rawEndTime: assignment.toTime,
      normalizedEndTime,
      workdayEndTime,
      isWorkdayEnd
    });
    return isWorkdayEnd;
  });

  if (hasEndTimeAtWorkdayEnd) {
    console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is FULLY BOOKED (ends at workday end)`);
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

  console.log(`[getEmployeeAvailabilityStatus] Employee ${employee.name} is PARTIALLY BOOKED (latest end: ${latestEndTime})`);
  
  const formattedTime = latestEndTime.substring(0, 5);
  return {
    status: 'partiallyBooked',
    statusText: t('employees.availableAfter', { time: formattedTime }),
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    availableAt: latestEndTime
  };
};
