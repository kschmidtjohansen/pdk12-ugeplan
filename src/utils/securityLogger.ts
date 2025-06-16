
import { supabase } from '@/integrations/supabase/client';

type SecurityEventType = 
  | 'auth_attempt' 
  | 'auth_failure' 
  | 'unauthorized_access' 
  | 'input_validation_error'
  | 'suspicious_activity'
  | 'admin_action'
  | 'data_access'
  | 'security_error';

type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

interface SecurityEventDetails {
  [key: string]: any;
}

export const logSecurityEvent = async (
  eventType: SecurityEventType,
  message: string,
  details?: SecurityEventDetails,
  severity: SecuritySeverity = 'info'
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const enrichedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity,
      userId: user?.id || null
    };

    const { error } = await supabase
      .from('logs')
      .insert({
        event_type: eventType,
        message,
        details: enrichedDetails
      });

    if (error) {
      console.error('Failed to log security event:', error);
    }
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

export const logAuthAttempt = (email: string, success: boolean, errorMessage?: string) => {
  logSecurityEvent(
    success ? 'auth_attempt' : 'auth_failure',
    `Authentication ${success ? 'successful' : 'failed'} for ${email}`,
    {
      email: email.toLowerCase(),
      success,
      errorMessage,
      timestamp: new Date().toISOString()
    },
    success ? 'info' : 'warning'
  );
};

export const logUnauthorizedAccess = (resource: string, attemptedAction: string) => {
  logSecurityEvent(
    'unauthorized_access',
    `Unauthorized access attempt to ${resource}`,
    {
      resource,
      attemptedAction,
      timestamp: new Date().toISOString()
    },
    'warning'
  );
};

export const logInputValidationError = (field: string, value: string, error: string) => {
  logSecurityEvent(
    'input_validation_error',
    `Input validation failed for ${field}`,
    {
      field,
      value: value.substring(0, 100), // Limit logged value length
      error,
      timestamp: new Date().toISOString()
    },
    'warning'
  );
};

export const logAdminAction = (action: string, targetUserId?: string, details?: any) => {
  logSecurityEvent(
    'admin_action',
    `Admin action: ${action}`,
    {
      action,
      targetUserId,
      details,
      timestamp: new Date().toISOString()
    },
    'info'
  );
};
