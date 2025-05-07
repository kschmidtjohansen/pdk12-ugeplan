
import { supabase } from '../integrations/supabase/client';

// Helper functions to handle standard API responses
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw new Error(error?.message || 'An unknown error occurred');
};

export { supabase };
