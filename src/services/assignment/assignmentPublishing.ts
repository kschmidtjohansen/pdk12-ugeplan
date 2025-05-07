
import { supabase, handleApiError } from '../../lib/supabase';

/**
 * Specialized service for assignment publishing functionality
 */
export const publishingService = {
  async publishAssignment(id: string) {
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
  
  async publishAssignmentsByDate(date: string) {
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
  }
};
