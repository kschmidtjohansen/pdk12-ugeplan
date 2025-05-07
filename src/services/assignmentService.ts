
import { supabase, handleApiError } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];
export type AssignmentEmployee = Database['public']['Tables']['assignment_employees']['Row'];

interface AssignmentWithEmployees extends Assignment {
  employees: string[];
}

export const assignmentService = {
  async getAll() {
    try {
      // Get all assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');
      
      if (assignmentsError) throw assignmentsError;
      if (!assignments) return [];
      
      // For each assignment, get the assigned employees
      const assignmentsWithEmployees = await Promise.all(
        assignments.map(async (assignment) => {
          const { data: assignmentEmployees, error: employeesError } = await supabase
            .from('assignment_employees')
            .select('employee_id, employees(name)')
            .eq('assignment_id', assignment.id);
          
          if (employeesError) throw employeesError;
          
          // Extract employee names
          const employees = assignmentEmployees?.map(ae => (ae as any).employees?.name || '') || [];
          
          return {
            ...assignment,
            employees
          };
        })
      );
      
      return assignmentsWithEmployees;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getByWeek(weekNumber: number) {
    // Implementation would filter assignments by the week number
    // This would typically be done in the database query
    try {
      const assignments = await this.getAll();
      // Client-side filtering by week number
      // In a real implementation, this would be done via a database query or stored procedure
      return assignments.filter(assignment => {
        const date = new Date(assignment.date);
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const currentWeek = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return currentWeek === weekNumber;
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getById(id: string) {
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (assignmentError) throw assignmentError;
      if (!assignment) throw new Error('Assignment not found');
      
      // Get assigned employees
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignment_employees')
        .select('employee_id, employees(name)')
        .eq('assignment_id', id);
      
      if (employeesError) throw employeesError;
      
      // Extract employee names
      const employees = assignmentEmployees?.map(ae => (ae as any).employees?.name || '') || [];
      
      return {
        ...assignment,
        employees
      };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async create(assignment: Omit<AssignmentWithEmployees, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // First, create the assignment
      const { employees, ...assignmentData } = assignment;
      
      const { data: newAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          date: assignmentData.date,
          from_time: assignmentData.from_time,
          to_time: assignmentData.to_time,
          location: assignmentData.location,
          car_id: assignmentData.car_id,
          published: assignmentData.published || false
        })
        .select()
        .single();
      
      if (assignmentError) throw assignmentError;
      
      // Then, create assignment-employee relationships
      if (employees && employees.length > 0) {
        // First, get employee IDs from employee names
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, name')
          .in('name', employees);
        
        if (employeeError) throw employeeError;
        
        if (employeeData && employeeData.length > 0) {
          // Create the relationships
          const assignmentEmployees = employeeData.map(emp => ({
            assignment_id: newAssignment.id,
            employee_id: emp.id
          }));
          
          const { error: relationError } = await supabase
            .from('assignment_employees')
            .insert(assignmentEmployees);
          
          if (relationError) throw relationError;
        }
      }
      
      return {
        ...newAssignment,
        employees
      };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async update(id: string, assignment: Partial<AssignmentWithEmployees>) {
    try {
      const { employees, ...assignmentData } = assignment;
      
      // Update the assignment
      const { data: updatedAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single();
      
      if (assignmentError) throw assignmentError;
      
      // Update employee assignments if provided
      if (employees) {
        // First, remove existing assignments
        const { error: deleteError } = await supabase
          .from('assignment_employees')
          .delete()
          .eq('assignment_id', id);
        
        if (deleteError) throw deleteError;
        
        if (employees.length > 0) {
          // Get employee IDs from names
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('id, name')
            .in('name', employees);
          
          if (employeeError) throw employeeError;
          
          if (employeeData && employeeData.length > 0) {
            // Create new relationships
            const assignmentEmployees = employeeData.map(emp => ({
              assignment_id: id,
              employee_id: emp.id
            }));
            
            const { error: relationError } = await supabase
              .from('assignment_employees')
              .insert(assignmentEmployees);
            
            if (relationError) throw relationError;
          }
        }
      }
      
      return {
        ...updatedAssignment,
        employees: employees || []
      };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async publish(id: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async publishByDate(date: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('date', date)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async delete(id: string) {
    try {
      // First delete assignment-employee relationships
      const { error: relationError } = await supabase
        .from('assignment_employees')
        .delete()
        .eq('assignment_id', id);
      
      if (relationError) throw relationError;
      
      // Then delete the assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
