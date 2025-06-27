
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  message: string;
  details?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export const logSecurityEvent = async (
  eventType: string,
  message: string,
  details: Record<string, any> = {},
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
) => {
  try {
    const { error } = await supabase.rpc('log_security_event_safe', {
      event_type: eventType,
      event_message: message,
      event_details: details,
      severity
    });

    if (error) {
      console.error('[SecurityLogger] Failed to log security event:', error);
      // Fallback: log to console if database logging fails
      console.log(`[SecurityEvent] ${eventType}: ${message}`, details);
    }
  } catch (err) {
    console.error('[SecurityLogger] Security logging error:', err);
    // Always ensure security events are visible in development
    console.log(`[SecurityEvent] ${eventType}: ${message}`, details);
  }
};

// Add the missing securityLog export as an alias
export const securityLog = logSecurityEvent;

export const logAuthEvent = (eventType: string, details: Record<string, any> = {}) => {
  logSecurityEvent(`auth_${eventType}`, `Authentication event: ${eventType}`, details, 'info');
};

export const logAuthAttempt = (email: string, success: boolean, error?: string) => {
  logSecurityEvent(
    'auth_attempt',
    `Login attempt for ${email}: ${success ? 'success' : 'failed'}`,
    { email, success, error },
    success ? 'info' : 'warning'
  );
};

export const logUnauthorizedAccess = (resource: string, reason: string, details: Record<string, any> = {}) => {
  logSecurityEvent(
    'unauthorized_access',
    `Unauthorized access attempt to ${resource}: ${reason}`,
    { resource, reason, ...details },
    'warning'
  );
};

export const logAccessAttempt = (resource: string, allowed: boolean, details: Record<string, any> = {}) => {
  logSecurityEvent(
    'access_attempt',
    `Access ${allowed ? 'granted' : 'denied'} to ${resource}`,
    { resource, allowed, ...details },
    allowed ? 'info' : 'warning'
  );
};

export const logInputValidationError = (field: string, input: string, error: string) => {
  logSecurityEvent(
    'input_validation_error',
    `Input validation failed for ${field}: ${error}`,
    { field, input: input.substring(0, 100), error },
    'warning'
  );
};

export const logPerformanceIssue = (operation: string, duration: number, threshold: number) => {
  logSecurityEvent(
    'performance_issue',
    `Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
    { operation, duration, threshold },
    'warning'
  );
};

export const logSystemError = (component: string, error: any, context: Record<string, any> = {}) => {
  logSecurityEvent(
    'system_error',
    `System error in ${component}: ${String(error)}`,
    { component, error: String(error), stack: error?.stack, ...context },
    'error'
  );
};
