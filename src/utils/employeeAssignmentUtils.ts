
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { isEmployeeOnVacation } from './employeeAvailability';

/**
 * Check if an employee should be removed from assignments due to unavailability
 */
export const shouldRemoveEmployeeFromAssignment = (
  employee: Employee,
  assignmentDate: string,
  vacations: Vacation[]
): boolean => {
  // Check if employee is manually marked as on leave
  if (employee.onLeave) {
    return true;
  }

  // Check if employee is on vacation on the assignment date
  try {
    let dateForComparison: Date;
    if (assignmentDate.includes('/')) {
      const [day, month, year] = assignmentDate.split('/');
      dateForComparison = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    } else if (assignmentDate.includes('T')) {
      dateForComparison = new Date(assignmentDate.split('T')[0] + 'T12:00:00');
    } else {
      dateForComparison = new Date(assignmentDate + 'T12:00:00');
    }

    return isEmployeeOnVacation(employee.id, dateForComparison, vacations);
  } catch (e) {
    console.error('Error parsing assignment date for employee availability check:', e);
    return false;
  }
};

/**
 * Remove unavailable employees from assignments
 */
export const filterAvailableEmployeesFromAssignment = (
  assignment: Assignment,
  employees: Employee[],
  vacations: Vacation[]
): string[] => {
  if (!assignment.employees || !Array.isArray(assignment.employees)) {
    return [];
  }

  return assignment.employees.filter(employeeName => {
    const employee = employees.find(emp => emp.name === employeeName);
    if (!employee) {
      console.warn(`Employee ${employeeName} not found in employee list`);
      return false;
    }

    return !shouldRemoveEmployeeFromAssignment(employee, assignment.date, vacations);
  });
};

/**
 * Clean up assignments by removing unavailable employees
 */
export const cleanupAssignmentEmployees = (
  assignments: Assignment[],
  employees: Employee[],
  vacations: Vacation[]
): Assignment[] => {
  return assignments.map(assignment => ({
    ...assignment,
    employees: filterAvailableEmployeesFromAssignment(assignment, employees, vacations)
  }));
};
