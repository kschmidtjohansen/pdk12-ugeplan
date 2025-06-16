
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

        // Log critical errors to database
        if (attempts === 1) {
          try {
            await supabase.rpc('log_security_event_safe', {
              event_type: 'operation_failure',
              event_message: `${operationName} failed: ${error}`,
              event_details: { 
                operation: operationName, 
                error: String(error),
                attempt: attempts
              },
              severity: 'error'
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

    // All attempts failed
    if (enableLogging) {
      console.error(`[ErrorRecovery] ${operationName} failed after ${maxRetries} attempts:`, lastError);
    }

    // Show user-friendly error message
    toast({
      title: `${operationName} Failed`,
      description: `Operation failed after ${maxRetries} attempts. Please try again later.`,
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
