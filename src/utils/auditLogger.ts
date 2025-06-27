
import { securityLog } from './secureLogger';
import { logSecurityEvent } from './securityLogger';

export interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export class AuditLogger {
  // Log admin actions
  static async logAdminAction(
    action: string, 
    resource: string, 
    resourceId?: string, 
    details: Record<string, any> = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      action,
      resource,
      resourceId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: navigator?.userAgent?.substring(0, 100) || 'unknown'
      },
      severity: 'info'
    };

    // Log to console (development)
    securityLog(`Admin Action: ${action} on ${resource}`, auditEvent.details);

    // Log to database
    try {
      await logSecurityEvent(
        `admin_${action}`,
        `Admin action: ${action} on ${resource} ${resourceId || ''}`,
        auditEvent.details,
        'info'
      );
    } catch (error) {
      console.error('Failed to log admin action to database:', error);
    }
  }

  // Log vacation request actions
  static async logVacationAction(
    action: 'create' | 'approve' | 'reject' | 'delete' | 'update',
    vacationId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      action,
      resource: 'vacation',
      resourceId: vacationId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      severity: action === 'delete' ? 'warning' : 'info'
    };

    securityLog(`Vacation Action: ${action}`, auditEvent.details);

    try {
      await logSecurityEvent(
        `vacation_${action}`,
        `Vacation ${action} for request ${vacationId}`,
        auditEvent.details,
        auditEvent.severity
      );
    } catch (error) {
      console.error('Failed to log vacation action to database:', error);
    }
  }

  // Log assignment actions
  static async logAssignmentAction(
    action: 'create' | 'update' | 'delete' | 'publish',
    assignmentId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      action,
      resource: 'assignment',
      resourceId: assignmentId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      severity: action === 'delete' ? 'warning' : 'info'
    };

    securityLog(`Assignment Action: ${action}`, auditEvent.details);

    try {
      await logSecurityEvent(
        `assignment_${action}`,
        `Assignment ${action} for ${assignmentId}`,
        auditEvent.details,
        auditEvent.severity
      );
    } catch (error) {
      console.error('Failed to log assignment action to database:', error);
    }
  }

  // Log user management actions
  static async logUserAction(
    action: 'create' | 'update' | 'delete' | 'role_change' | 'status_change',
    targetUserId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      action,
      resource: 'user',
      resourceId: targetUserId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      severity: action === 'delete' ? 'critical' : 'warning'
    };

    securityLog(`User Management Action: ${action}`, auditEvent.details);

    try {
      await logSecurityEvent(
        `user_${action}`,
        `User management ${action} for user ${targetUserId}`,
        auditEvent.details,
        auditEvent.severity
      );
    } catch (error) {
      console.error('Failed to log user action to database:', error);
    }
  }

  // Log authentication events
  static async logAuthEvent(
    event: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'password_reset',
    details: Record<string, any> = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      action: event,
      resource: 'authentication',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        // Don't log sensitive info like passwords
        ip: 'masked', // You would get this from server-side
        userAgent: navigator?.userAgent?.substring(0, 100) || 'unknown'
      },
      severity: event.includes('failure') ? 'warning' : 'info'
    };

    securityLog(`Auth Event: ${event}`, auditEvent.details);

    try {
      await logSecurityEvent(
        `auth_${event}`,
        `Authentication event: ${event}`,
        auditEvent.details,
        auditEvent.severity
      );
    } catch (error) {
      console.error('Failed to log auth event to database:', error);
    }
  }

  // Log security events
  static async logSecurityEvent(
    event: string,
    details: Record<string, any> = {},
    severity: 'info' | 'warning' | 'error' | 'critical' = 'warning'
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      action: event,
      resource: 'security',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      severity
    };

    securityLog(`Security Event: ${event}`, auditEvent.details);

    try {
      await logSecurityEvent(
        `security_${event}`,
        `Security event: ${event}`,
        auditEvent.details,
        severity
      );
    } catch (error) {
      console.error('Failed to log security event to database:', error);
    }
  }
}
