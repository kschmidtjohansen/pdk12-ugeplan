import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/securityLogger';

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  details?: any;
  timestamp: string;
  userId?: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  userRole?: string;
  retryCount?: number;
  cacheHit?: boolean;
  timing?: number;
  additionalData?: Record<string, any>;
}

export class EnhancedErrorHandler {
  private static instance: EnhancedErrorHandler;
  
  static getInstance(): EnhancedErrorHandler {
    if (!EnhancedErrorHandler.instance) {
      EnhancedErrorHandler.instance = new EnhancedErrorHandler();
    }
    return EnhancedErrorHandler.instance;
  }

  /**
   * Properly serialize any error object for logging and analysis
   */
  serializeError(error: any): SerializedError {
    const timestamp = new Date().toISOString();
    
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp,
        code: (error as any).code,
        details: (error as any).details || (error as any).hint
      };
    }
    
    if (typeof error === 'object' && error !== null) {
      return {
        name: error.name || 'UnknownError',
        message: error.message || JSON.stringify(error),
        timestamp,
        code: error.code,
        details: error.details || error.hint,
        stack: error.stack
      };
    }
    
    return {
      name: 'UnknownError',
      message: String(error),
      timestamp
    };
  }

  /**
   * Categorize errors for better handling and routing
   */
  categorizeError(error: SerializedError): 'auth' | 'network' | 'rls' | 'timeout' | 'database' | 'validation' | 'unknown' {
    const message = error.message.toLowerCase();
    const code = error.code?.toLowerCase();
    
    // Authentication errors
    if (message.includes('jwt') || message.includes('auth') || message.includes('unauthorized') || 
        message.includes('token') || code === '401') {
      return 'auth';
    }
    
    // RLS policy errors
    if (message.includes('rls') || message.includes('policy') || message.includes('permission') ||
        message.includes('row level security') || code === '42501') {
      return 'rls';
    }
    
    // Network/timeout errors
    if (message.includes('timeout') || message.includes('network') || message.includes('fetch') ||
        message.includes('connection') || code === 'ECONNRESET' || code === 'ENOTFOUND') {
      return 'timeout';
    }
    
    // Database errors
    if (message.includes('relation') || message.includes('column') || message.includes('table') ||
        message.includes('constraint') || code?.startsWith('23') || code?.startsWith('42')) {
      return 'database';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required') ||
        code?.startsWith('22')) {
      return 'validation';
    }
    
    return 'unknown';
  }

  /**
   * Enhanced error logging with proper context and categorization
   */
  async logError(error: any, context: ErrorContext): Promise<void> {
    try {
      const serializedError = this.serializeError(error);
      const category = this.categorizeError(serializedError);
      
      // Get current user info if not provided
      let userId = context.userId;
      let userRole = context.userRole;
      
      if (!userId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        } catch {
          // Ignore auth errors when trying to get user context
        }
      }
      
      if (!userRole && userId) {
        try {
          const { data } = await supabase.rpc('get_current_user_role');
          userRole = data;
        } catch {
          // Ignore role lookup errors
        }
      }

      const enhancedContext = {
        ...context,
        userId,
        userRole,
        category,
        serializedError,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      };

      // Log based on severity and category
      const severity = this.determineLogSeverity(category, context.retryCount || 0);
      
      await logSecurityEvent(
        `enhanced_error_${category}`,
        `${context.operation} failed: ${serializedError.message}`,
        enhancedContext,
        severity
      );

    } catch (loggingError) {
      // Fallback to console logging if structured logging fails
      console.error('[EnhancedErrorHandler] Failed to log error:', loggingError);
      console.error('[EnhancedErrorHandler] Original error:', error);
      console.error('[EnhancedErrorHandler] Context:', context);
    }
  }

  /**
   * Determine appropriate log severity based on error type and retry count
   */
  private determineLogSeverity(category: string, retryCount: number): 'info' | 'warning' | 'error' | 'critical' {
    // Critical errors that need immediate attention
    if (category === 'database' || category === 'rls') {
      return 'critical';
    }
    
    // Auth errors are serious but may be user-related
    if (category === 'auth') {
      return retryCount > 2 ? 'error' : 'warning';
    }
    
    // Network/timeout errors - escalate based on retry count
    if (category === 'timeout' || category === 'network') {
      if (retryCount > 3) return 'error';
      if (retryCount > 1) return 'warning';
      return 'info';
    }
    
    // Validation errors are usually user input issues
    if (category === 'validation') {
      return 'warning';
    }
    
    // Unknown errors need investigation
    return retryCount > 2 ? 'error' : 'warning';
  }

  /**
   * Create user-friendly error messages based on error category
   */
  getUserFriendlyMessage(error: SerializedError, category: string): string {
    switch (category) {
      case 'auth':
        return 'Your session has expired. Please log in again.';
      case 'rls':
        return 'You do not have permission to access this data. Please contact an administrator.';
      case 'timeout':
      case 'network':
        return 'Network connection problem. Please check your internet connection and try again.';
      case 'database':
        return 'A system error occurred. Our team has been notified and will resolve this shortly.';
      case 'validation':
        return 'Invalid data provided. Please check your input and try again.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Check if an error should trigger a retry
   */
  shouldRetry(error: SerializedError, category: string, currentRetry: number, maxRetries: number): boolean {
    if (currentRetry >= maxRetries) return false;
    
    // Don't retry auth errors - they need user intervention
    if (category === 'auth') return false;
    
    // Don't retry RLS errors - they indicate a permission problem
    if (category === 'rls') return false;
    
    // Don't retry validation errors - they need input correction
    if (category === 'validation') return false;
    
    // Don't retry database schema errors
    if (category === 'database' && (
      error.message.includes('relation') || 
      error.message.includes('column') || 
      error.message.includes('constraint')
    )) {
      return false;
    }
    
    // Retry network/timeout errors and unknown errors
    return category === 'timeout' || category === 'network' || category === 'unknown';
  }
}

export const enhancedErrorHandler = EnhancedErrorHandler.getInstance();