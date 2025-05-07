
import { supabase } from '../integrations/supabase/client';

/**
 * Helper function to handle standard API errors
 * @param error The error object returned from a Supabase operation
 * @returns Never returns - throws an enhanced error object
 */
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  // Create a more descriptive error message based on the type of error
  const errorMessage = error?.message || 'An unknown error occurred';
  
  // Check for authentication errors
  if (error?.status === 401 || errorMessage.includes('auth')) {
    throw new Error(`Authentication error: ${errorMessage}. Please try logging in again.`);
  }
  
  // Check for permission errors
  if (error?.status === 403) {
    throw new Error(`Permission error: ${errorMessage}. You don't have access to this resource.`);
  }
  
  // Check for not found errors
  if (error?.status === 404) {
    throw new Error(`Resource not found: ${errorMessage}`);
  }
  
  // Generic error
  throw new Error(errorMessage);
};

export { supabase };
