
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

interface RecoveryResult<T> {
  data: T | null;
  error: any;
  attempts: number;
  recovered: boolean;
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const { maxRetries = 3, retryDelay = 1000, enableLogging = true } = options;
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Operation'
  ): Promise<RecoveryResult<T>> => {
    setIsRecovering(true);
    let attempts = 0;
    let lastError: any = null;

    while (attempts < maxRetries) {
      attempts++;
      
      try {
        if (enableLogging) {
          console.log(`[ErrorRecovery] ${operationName} attempt ${attempts}/${maxRetries}`);
        }

        const result = await operation();
        
        if (enableLogging && attempts > 1) {
          console.log(`[ErrorRecovery] ${operationName} recovered after ${attempts} attempts`);
        }

        setIsRecovering(false);
        return {
          data: result,
          error: null,
          attempts,
          recovered: attempts > 1
        };

      } catch (error) {
        lastError = error;
        
        if (enableLogging) {
          console.warn(`[ErrorRecovery] ${operationName} failed on attempt ${attempts}:`, error);
        }

        // Enhanced error categorization
        const errorMessage = error instanceof Error ? error.message : String(error);
        let errorCategory = 'unknown';
        
        if (errorMessage.includes('JWT') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
          errorCategory = 'authentication';
        } else if (errorMessage.includes('RLS') || errorMessage.includes('policy') || errorMessage.includes('permission')) {
          errorCategory = 'authorization';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
          errorCategory = 'network';
        } else if (errorMessage.includes('relation') || errorMessage.includes('column') || errorMessage.includes('table')) {
          errorCategory = 'database_schema';
        }

        // Log critical errors using optimized data fetch error logging
        if (attempts === 1) {
          try {
            await supabase.rpc('log_data_fetch_error_safe', {
              operation_type: operationName,
              error_message: errorMessage,
              user_id_param: null, // Will use auth.uid() in function
              retry_count: attempts - 1
            });
          } catch (logError) {
            console.warn('[ErrorRecovery] Failed to log error:', logError);
          }
        }

        if (attempts < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed - provide specific error messaging
    if (enableLogging) {
      console.error(`[ErrorRecovery] ${operationName} failed after ${maxRetries} attempts:`, lastError);
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    let userFriendlyMessage = `${operationName} failed after ${maxRetries} attempts. Please try again later.`;
    
    if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
      userFriendlyMessage = 'Session expired. Please log in again.';
    } else if (errorMessage.includes('RLS') || errorMessage.includes('policy')) {
      userFriendlyMessage = 'Access denied. You may not have permission to view this data.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyMessage = 'Network error. Please check your connection and try again.';
    }

    // Show user-friendly error message
    toast({
      title: `${operationName} Failed`,
      description: userFriendlyMessage,
      variant: 'destructive'
    });

    setIsRecovering(false);
    return {
      data: null,
      error: lastError,
      attempts,
      recovered: false
    };
  }, [maxRetries, retryDelay, enableLogging, toast]);

  const recoverDatabaseConnection = useCallback(async () => {
    return executeWithRecovery(async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      return data;
    }, 'Database Connection Recovery');
  }, [executeWithRecovery]);

  const recoverAuthSession = useCallback(async () => {
    return executeWithRecovery(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    }, 'Auth Session Recovery');
  }, [executeWithRecovery]);

  return {
    executeWithRecovery,
    recoverDatabaseConnection,
    recoverAuthSession,
    isRecovering
  };
};
