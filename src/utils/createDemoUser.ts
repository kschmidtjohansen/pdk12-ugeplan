import { supabase } from '@/integrations/supabase/client';
import { DemoUserService } from '@/services/demoUserService';
import { getSecurityEnvironment } from '@/config/security';

export const createDemoUser = async () => {
  try {
    const { getDemoCredentials } = getSecurityEnvironment();
    const credentials = getDemoCredentials();
    
    // Create the demo user using the admin edge function
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: DemoUserService.DEMO_USER_EMAIL,
        password: credentials.password,
        name: 'Demo User',
        role: 'administrator'
      }
    });

    if (error) {
      console.error('Failed to create demo user:', error);
      return { success: false, error: error.message };
    }

    console.log('Demo user created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error creating demo user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};