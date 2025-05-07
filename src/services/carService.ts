
import { supabase, handleApiError } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Car = Database['public']['Tables']['cars']['Row'];
export type CarInsert = Database['public']['Tables']['cars']['Insert'];
export type CarUpdate = Database['public']['Tables']['cars']['Update'];

export const carService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('cars')
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
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(car: CarInsert) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .insert(car)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id: string, car: CarUpdate) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .update(car)
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
        .from('cars')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
