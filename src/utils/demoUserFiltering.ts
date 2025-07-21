import { DemoUserService } from '@/services/demoUserService';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';

export class DemoUserFiltering {
  private static demoService = DemoUserService.getInstance();

  /**
   * Check if the current user is a demo user
   */
  static isDemoUser(currentUserEmail?: string): boolean {
    return currentUserEmail ? this.demoService.isDemoUser(currentUserEmail) : false;
  }

  /**
   * Filter employees to hide demo user from non-demo users
   */
  static filterEmployees(employees: Employee[], currentUserEmail?: string): Employee[] {
    if (this.isDemoUser(currentUserEmail)) {
      // Demo user sees all employees including themselves
      return employees;
    }
    
    // Non-demo users don't see the demo user
    return employees.filter(emp => !this.demoService.isDemoUser(emp.email));
  }

  /**
   * Filter assignments to hide demo user assignments from non-demo users
   */
  static filterAssignments(assignments: Assignment[], currentUserEmail?: string): Assignment[] {
    if (this.isDemoUser(currentUserEmail)) {
      // Demo user sees all assignments including their own
      return assignments;
    }
    
    // Non-demo users don't see assignments created by or assigned to demo user
    return assignments.filter(assignment => {
      // Filter out assignments where responsible user is demo user
      if (assignment.responsibleUserId === DemoUserService.DEMO_USER_ID) {
        return false;
      }
      
      // Filter out assignments where demo user is in assignedEmployees
      if (assignment.assignedEmployees) {
        const hasDemoUser = assignment.assignedEmployees.some(emp => 
          emp.id === DemoUserService.DEMO_USER_ID || 
          this.demoService.isDemoUser(emp.email)
        );
        if (hasDemoUser) return false;
      }
      
      // Filter out assignments where demo user is in employees array (legacy format)
      if (assignment.employees && Array.isArray(assignment.employees)) {
        const hasDemoUser = assignment.employees.some(emp => {
          if (typeof emp === 'string') {
            // Check by name - find the employee to get their email
            return emp === 'Test User' || emp === 'test@polygongroup.com';
          }
          return false;
        });
        if (hasDemoUser) return false;
      }
      
      return true;
    });
  }

  /**
   * Filter vacations to hide demo user vacations from non-demo users
   */
  static filterVacations(vacations: Vacation[], currentUserEmail?: string): Vacation[] {
    if (this.isDemoUser(currentUserEmail)) {
      // Demo user sees all vacations including their own
      return vacations;
    }
    
    // Non-demo users don't see demo user vacations
    return vacations.filter(vacation => 
      vacation.user_id !== DemoUserService.DEMO_USER_ID
    );
  }

  /**
   * Get eligible employees for responsible user selector (hides demo user from non-demo users)
   */
  static getEligibleResponsibleUsers(employees: Employee[], currentUserEmail?: string): Employee[] {
    const filtered = this.filterEmployees(employees, currentUserEmail);
    
    // Further filter to only admin/skadeleder roles for responsible users
    return filtered.filter(emp => 
      emp.role === 'administrator' || emp.role === 'skadeleder'
    );
  }

  /**
   * Apply demo user filtering to enhanced data fetching results
   */
  static applyDataFiltering<T>(
    data: T[], 
    dataType: 'employees' | 'assignments' | 'vacations',
    currentUserEmail?: string
  ): T[] {
    switch (dataType) {
      case 'employees':
        return this.filterEmployees(data as Employee[], currentUserEmail) as T[];
      case 'assignments':
        return this.filterAssignments(data as Assignment[], currentUserEmail) as T[];
      case 'vacations':
        return this.filterVacations(data as Vacation[], currentUserEmail) as T[];
      default:
        return data;
    }
  }
}