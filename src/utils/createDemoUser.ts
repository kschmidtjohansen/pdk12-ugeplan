import { supabase } from '@/integrations/supabase/client';

export const createDemoUser = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Creating demo user...');
    
    const { data, error } = await supabase.functions.invoke('create-demo-user');
    
    if (error) {
      console.error('Error creating demo user:', error);
      return { 
        success: false, 
        message: `Failed to create demo user: ${error.message}` 
      };
    }
    
    console.log('Demo user creation result:', data);
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Exception creating demo user:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while creating the demo user.' 
    };
  }
};