
import { supabase, handleApiError } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export const employeeService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(employee: EmployeeInsert) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id: string, employee: EmployeeUpdate) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async toggleLeaveStatus(id: string, onLeave: boolean) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({ on_leave: onLeave })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
