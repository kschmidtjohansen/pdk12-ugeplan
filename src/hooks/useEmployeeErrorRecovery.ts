
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EmployeeErrorRecoveryOptions {
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

export const useEmployeeErrorRecovery = (options: EmployeeErrorRecoveryOptions = {}) => {
  const { maxRetries = 3, retryDelay = 1000, enableLogging = true } = options;
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Employee Operation'
  ): Promise<RecoveryResult<T>> => {
    setIsRecovering(true);
    let attempts = 0;
    let lastError: any = null;

    while (attempts < maxRetries) {
      attempts++;
      
      try {
        if (enableLogging) {
          console.log(`[EmployeeErrorRecovery] ${operationName} attempt ${attempts}/${maxRetries}`);
        }

        const result = await operation();
        
        if (enableLogging && attempts > 1) {
          console.log(`[EmployeeErrorRecovery] ${operationName} recovered after ${attempts} attempts`);
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
          console.warn(`[EmployeeErrorRecovery] ${operationName} failed on attempt ${attempts}:`, error);
        }

        // Enhanced error categorization for employee operations
        const errorMessage = error instanceof Error ? error.message : String(error);
        let errorCategory = 'unknown';
        
        if (errorMessage.includes('JWT') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
          errorCategory = 'authentication';
        } else if (errorMessage.includes('RLS') || errorMessage.includes('policy') || errorMessage.includes('permission')) {
          errorCategory = 'authorization';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
          errorCategory = 'network';
        } else if (errorMessage.includes('profiles') || errorMessage.includes('user_roles')) {
          errorCategory = 'employee_data';
        }

        // Log critical errors for employee operations
        if (attempts === 1) {
          try {
            await supabase.rpc('log_security_event_safe', {
              event_type: `employee_${operationName.toLowerCase()}_failure`,
              event_message: `Employee ${operationName} failed: ${errorMessage}`,
              event_details: { 
                operation: operationName, 
                error: errorMessage,
                error_category: errorCategory,
                attempt: attempts,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                url: window.location.href
              },
              severity: 'error'
            });
          } catch (logError) {
            console.warn('[EmployeeErrorRecovery] Failed to log error:', logError);
          }
        }

        if (attempts < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed - provide specific error messaging for employee operations
    if (enableLogging) {
      console.error(`[EmployeeErrorRecovery] ${operationName} failed after ${maxRetries} attempts:`, lastError);
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    let userFriendlyMessage = `Employee ${operationName.toLowerCase()} failed after ${maxRetries} attempts. Please try again later.`;
    
    if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
      userFriendlyMessage = 'Session expired. Please log in again to manage employees.';
    } else if (errorMessage.includes('RLS') || errorMessage.includes('policy')) {
      userFriendlyMessage = 'Access denied. You may not have permission to manage employee data.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyMessage = 'Network error loading employees. Please check your connection and try again.';
    } else if (errorMessage.includes('profiles') || errorMessage.includes('user_roles')) {
      userFriendlyMessage = 'Employee data access error. The system is working to resolve this issue.';
    }

    // Show user-friendly error message
    toast({
      title: `Employee ${operationName} Failed`,
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

  const recoverEmployeeConnection = useCallback(async () => {
    return executeWithRecovery(async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      return data;
    }, 'Employee Database Connection Recovery');
  }, [executeWithRecovery]);

  return {
    executeWithRecovery,
    recoverEmployeeConnection,
    isRecovering
  };
};
