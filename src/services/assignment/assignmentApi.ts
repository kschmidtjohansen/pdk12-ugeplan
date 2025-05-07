
import { supabase, handleApiError } from '../../lib/supabase';

/**
 * Core API functions for assignment CRUD operations
 */
export const assignmentApi = {
  async getAssignments() {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getAssignmentById(id: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getAssignmentEmployees(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('assignment_employees')
        .select('employee_id, employees(name)')
        .eq('assignment_id', assignmentId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createAssignment(assignmentData: any) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateAssignment(id: string, assignmentData: any) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async deleteAssignment(id: string) {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createAssignmentEmployees(assignmentEmployees: any[]) {
    try {
      const { error } = await supabase
        .from('assignment_employees')
        .insert(assignmentEmployees);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async deleteAssignmentEmployees(assignmentId: string) {
    try {
      const { error } = await supabase
        .from('assignment_employees')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getEmployeesByNames(names: string[]) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .in('name', names);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleApiError(error);
    }
  }
};
