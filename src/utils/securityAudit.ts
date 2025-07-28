import { logSecurityEvent } from './securityLogger';

// Security audit functions for monitoring and compliance
export class SecurityAudit {
  private static auditLog: Array<{
    timestamp: string;
    event: string;
    details: any;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }> = [];

  // Log security audit events
  static logAuditEvent(
    event: string,
    details: any = {},
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity
    };

    this.auditLog.push(auditEntry);
    
    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Log to security system
    logSecurityEvent('audit_event', `Security audit: ${event}`, {
      auditDetails: details,
      auditSeverity: severity
    }, severity);
  }

  // Get audit log entries
  static getAuditLog(severityFilter?: string): typeof SecurityAudit.auditLog {
    if (severityFilter) {
      return this.auditLog.filter(entry => entry.severity === severityFilter);
    }
    return [...this.auditLog];
  }

  // Clear audit log (admin only)
  static clearAuditLog(): void {
    this.logAuditEvent('audit_log_cleared', { clearedEntries: this.auditLog.length }, 'warning');
    this.auditLog = [];
  }

  // Check for security compliance
  static performSecurityCheck(): {
    passed: boolean;
    issues: Array<{ type: string; severity: string; description: string }>;
  } {
    const issues: Array<{ type: string; severity: string; description: string }> = [];

    // Check for HTTPS in production
    if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
      issues.push({
        type: 'insecure_connection',
        severity: 'critical',
        description: 'Application not served over HTTPS in production'
      });
    }

    // Check for secure storage
    try {
      localStorage.setItem('security_test', 'test');
      localStorage.removeItem('security_test');
    } catch (error) {
      issues.push({
        type: 'storage_unavailable',
        severity: 'warning',
        description: 'Local storage not available or disabled'
      });
    }

    // Check for Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      issues.push({
        type: 'missing_csp',
        severity: 'warning',
        description: 'Content Security Policy not detected'
      });
    }

    // Check for security headers
    const requiredHeaders = ['X-Frame-Options', 'X-Content-Type-Options'];
    requiredHeaders.forEach(header => {
      const headerMeta = document.querySelector(`meta[name="${header}"]`);
      if (!headerMeta) {
        issues.push({
          type: 'missing_security_header',
          severity: 'warning',
          description: `Missing security header: ${header}`
        });
      }
    });

    const passed = issues.filter(issue => issue.severity === 'critical' || issue.severity === 'error').length === 0;

    this.logAuditEvent('security_check_performed', {
      passed,
      issuesFound: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length
    }, passed ? 'info' : 'warning');

    return { passed, issues };
  }

  // Generate security report
  static generateSecurityReport(): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      warningEvents: number;
      lastAudit: string;
    };
    recommendations: string[];
    recentEvents: typeof SecurityAudit.auditLog;
  } {
    const recentEvents = this.auditLog.slice(-20); // Last 20 events
    const criticalEvents = this.auditLog.filter(e => e.severity === 'critical').length;
    const warningEvents = this.auditLog.filter(e => e.severity === 'warning').length;

    const recommendations: string[] = [];

    if (criticalEvents > 0) {
      recommendations.push('Address critical security issues immediately');
    }

    if (warningEvents > 10) {
      recommendations.push('Review warning-level security events');
    }

    if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
      recommendations.push('Ensure application is served over HTTPS in production');
    }

    recommendations.push('Regularly review security audit logs');
    recommendations.push('Keep security dependencies up to date');
    recommendations.push('Implement regular security testing');

    return {
      summary: {
        totalEvents: this.auditLog.length,
        criticalEvents,
        warningEvents,
        lastAudit: this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1].timestamp : 'Never'
      },
      recommendations,
      recentEvents
    };
  }
}
