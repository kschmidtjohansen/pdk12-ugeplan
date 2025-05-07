
import { supabase, handleApiError } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Vacation = Database['public']['Tables']['vacations']['Row'];
export type VacationInsert = Database['public']['Tables']['vacations']['Insert'];
export type VacationUpdate = Database['public']['Tables']['vacations']['Update'];

export const vacationService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getByEmployeeId(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('employee_id', employeeId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(vacation: VacationInsert) {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .insert(vacation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected', notes?: string) {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .update({ 
          status, 
          notes: notes || null 
        })
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
