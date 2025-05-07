import { assignmentApi } from './assignmentApi';
import { publishingService } from './assignmentPublishing';
import { assignmentHelpers } from './assignmentHelpers';
import { Assignment, AssignmentWithEmployees, AssignmentInsert } from './types';

/**
 * Main assignment service that coordinates between API calls and helpers
 */
export const assignmentService = {
  async getAll() {
    try {
      // Get all assignments
      const assignments = await assignmentApi.getAssignments();
      
      // For each assignment, get the assigned employees
      const assignmentsWithEmployees = await Promise.all(
        assignments.map(async (assignment) => {
          const assignmentEmployees = await assignmentApi.getAssignmentEmployees(assignment.id);
          const employees = assignmentHelpers.formatEmployeeData(assignmentEmployees);
          
          return {
            ...assignment,
            employees
          };
        })
      );
      
      return assignmentsWithEmployees;
    } catch (error) {
      throw error;
    }
  },
  
  async getByWeek(weekNumber: number) {
    try {
      const assignments = await this.getAll();
      return assignmentHelpers.filterByWeek(assignments, weekNumber);
    } catch (error) {
      throw error;
    }
  },
  
  async getById(id: string) {
    try {
      const assignment = await assignmentApi.getAssignmentById(id);
      if (!assignment) throw new Error('Assignment not found');
      
      const assignmentEmployees = await assignmentApi.getAssignmentEmployees(id);
      const employees = assignmentHelpers.formatEmployeeData(assignmentEmployees);
      
      return {
        ...assignment,
        employees
      };
    } catch (error) {
      throw error;
    }
  },
  
  async create(assignment: Omit<AssignmentWithEmployees, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // First, create the assignment
      const { employees, ...assignmentData } = assignment;
      
      // Create properly typed AssignmentInsert object
      const newAssignmentData: AssignmentInsert = {
        title: assignmentData.title || '',
        description: assignmentData.description || '',
        date: assignmentData.date || '',
        from_time: assignmentData.from_time || '',
        to_time: assignmentData.to_time || '',
        location: assignmentData.location || '',
        car_id: assignmentData.car_id || '',
        published: assignmentData.published ?? false
      };
      
      const newAssignment = await assignmentApi.createAssignment(newAssignmentData);
      
      // Then, create assignment-employee relationships if needed
      if (employees && employees.length > 0) {
        const employeeData = await assignmentApi.getEmployeesByNames(employees);
        
        if (employeeData && employeeData.length > 0) {
          const assignmentEmployees = employeeData.map(emp => ({
            assignment_id: newAssignment.id,
            employee_id: emp.id
          }));
          
          await assignmentApi.createAssignmentEmployees(assignmentEmployees);
        }
      }
      
      return {
        ...newAssignment,
        employees: employees || []
      };
    } catch (error) {
      throw error;
    }
  },
  
  async update(id: string, assignment: Partial<AssignmentWithEmployees>) {
    try {
      const { employees, ...assignmentData } = assignment;
      
      // Update the assignment
      const updatedAssignment = await assignmentApi.updateAssignment(id, assignmentData);
      
      // Update employee assignments if provided
      if (employees !== undefined) {
        // First, remove existing assignments
        await assignmentApi.deleteAssignmentEmployees(id);
        
        if (employees.length > 0) {
          const employeeData = await assignmentApi.getEmployeesByNames(employees);
          
          if (employeeData && employeeData.length > 0) {
            const assignmentEmployees = employeeData.map(emp => ({
              assignment_id: id,
              employee_id: emp.id
            }));
            
            await assignmentApi.createAssignmentEmployees(assignmentEmployees);
          }
        }
      }
      
      return {
        ...updatedAssignment,
        employees: employees || []
      };
    } catch (error) {
      throw error;
    }
  },
  
  async publish(id: string) {
    return publishingService.publishAssignment(id);
  },
  
  async publishByDate(date: string) {
    return publishingService.publishAssignmentsByDate(date);
  },
  
  async delete(id: string) {
    try {
      // First delete assignment-employee relationships
      await assignmentApi.deleteAssignmentEmployees(id);
      
      // Then delete the assignment
      return assignmentApi.deleteAssignment(id);
    } catch (error) {
      throw error;
    }
  }
};

export * from './types';
