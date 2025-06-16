
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { format } from 'date-fns';

export interface AssignmentValidationError {
  type: 'partial_vacation_conflict' | 'employee_unavailable';
  message: string;
  employeeName: string;
  conflictTime?: string;
}

export interface AssignmentValidationResult {
  isValid: boolean;
  errors: AssignmentValidationError[];
}

/**
 * Validates if employees can work for the full duration of an assignment
 * Checks for partial vacation conflicts where employees leave before assignment ends
 */
export const validateEmployeeAvailability = (
  selectedEmployeeNames: string[],
  assignmentDate: string,
  assignmentStartTime: string,
  assignmentEndTime: string,
  employees: Employee[],
  vacations: Vacation[]
): AssignmentValidationResult => {
  const errors: AssignmentValidationError[] = [];
  
  // Parse assignment date for comparison
  const assignmentDateObj = new Date(assignmentDate + 'T12:00:00');
  const assignmentDateStr = format(assignmentDateObj, 'yyyy-MM-dd');
  
  console.log('[validateEmployeeAvailability] Validating assignment:', {
    employees: selectedEmployeeNames,
    date: assignmentDateStr,
    startTime: assignmentStartTime,
    endTime: assignmentEndTime
  });
  
  selectedEmployeeNames.forEach(employeeName => {
    const employee = employees.find(emp => emp.name === employeeName);
    if (!employee) {
      console.log(`[validateEmployeeAvailability] Employee not found: ${employeeName}`);
      return;
    }
    
    // Check for partial day vacations that conflict with assignment end time
    const conflictingVacation = vacations.find(vacation => {
      if (vacation.user_id !== employee.id || vacation.status !== 'approved') {
        return false;
      }
      
      // Check if vacation is on the assignment date
      const vacationStartDate = new Date(vacation.start_date);
      const vacationEndDate = new Date(vacation.end_date);
      const normalizedAssignmentDate = new Date(assignmentDateStr);
      
      // Normalize dates to avoid timezone issues
      vacationStartDate.setHours(0, 0, 0, 0);
      vacationEndDate.setHours(0, 0, 0, 0);
      normalizedAssignmentDate.setHours(0, 0, 0, 0);
      
      const isOnAssignmentDate = normalizedAssignmentDate >= vacationStartDate && 
                                normalizedAssignmentDate <= vacationEndDate;
      
      if (!isOnAssignmentDate) {
        return false;
      }
      
      // Only check partial day vacations
      if (vacation.request_type !== 'partial_day' || !vacation.start_time || !vacation.end_time) {
        return false;
      }
      
      // Normalize times to HH:MM format
      const vacationStartTime = vacation.start_time.substring(0, 5);
      const vacationEndTime = vacation.end_time.substring(0, 5);
      const normalizedAssignmentEndTime = assignmentEndTime.substring(0, 5);
      
      console.log(`[validateEmployeeAvailability] Checking ${employeeName}:`, {
        vacationStartTime,
        vacationEndTime,
        assignmentEndTime: normalizedAssignmentEndTime
      });
      
      // Check if employee is off from a certain time (e.g., off from 13:00)
      // This means they start their vacation at 13:00 and the assignment can't go beyond that
      if (vacationStartTime < normalizedAssignmentEndTime) {
        console.log(`[validateEmployeeAvailability] Conflict found for ${employeeName}: vacation starts at ${vacationStartTime}, assignment ends at ${normalizedAssignmentEndTime}`);
        return true;
      }
      
      return false;
    });
    
    if (conflictingVacation) {
      const conflictTime = conflictingVacation.start_time?.substring(0, 5);
      errors.push({
        type: 'partial_vacation_conflict',
        message: `${employeeName} has time off from ${conflictTime}`,
        employeeName,
        conflictTime
      });
    }
  });
  
  console.log('[validateEmployeeAvailability] Validation result:', {
    isValid: errors.length === 0,
    errors
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
