
/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 'success'
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(error: string | Error): ApiResponse<never> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    error: errorMessage,
    status: 'error'
  };
}

/**
 * Handle API errors consistently
 */
export function handleError(error: unknown): ApiResponse<never> {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return createErrorResponse(error.message);
  }
  
  return createErrorResponse('An unknown error occurred');
}
