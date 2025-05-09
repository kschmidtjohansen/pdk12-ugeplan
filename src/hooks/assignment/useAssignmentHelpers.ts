
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentHelpers = () => {
  // Helper function to get car ID by name
  const getCarsIdByName = async (carName: string): Promise<string | null> => {
    if (!carName) return null;
    
    const { data, error } = await supabase
      .from('cars')
      .select('id')
      .eq('name', carName)
      .single();
    
    if (error || !data) {
      console.error('Error getting car ID by name:', error);
      return null;
    }
    
    return data.id;
  };
  
  // Helper function to get employee ID by name
  const getEmployeeIdByName = async (employeeName: string): Promise<string | null> => {
    if (!employeeName) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', employeeName)
      .single();
    
    if (error || !data) {
      console.error('Error getting employee ID by name:', error);
      return null;
    }
    
    return data.id;
  };

  return {
    getCarsIdByName,
    getEmployeeIdByName
  };
};
