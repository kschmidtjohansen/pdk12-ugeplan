import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSecurity } from '@/context/SecurityContext';
import { logSecurityEvent } from '@/utils/securityLogger';

interface SecurityMetrics {
  sessionStartTime: number;
  activityCount: number;
  lastActivity: number;
  suspiciousActivities: number;
}

export const useEnhancedSecurity = () => {
  const { user, isAuthenticated } = useAuth();
  const { checkRateLimit, refreshCSRFToken } = useSecurity();
  const metricsRef = useRef<SecurityMetrics>({
    sessionStartTime: Date.now(),
    activityCount: 0,
    lastActivity: Date.now(),
    suspiciousActivities: 0
  });

  // Monitor for security violations
  const detectSecurityViolation = useCallback((violationType: string, details: any = {}) => {
    metricsRef.current.suspiciousActivities++;
    
    logSecurityEvent(
      'security_violation',
      `Security violation detected: ${violationType}`,
      {
        ...details,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        sessionMetrics: metricsRef.current
      },
      'warning'
    );
  }, [user?.id]);

  // Enhanced input validation with security logging
  const validateSecureInput = useCallback((input: string, context: string): boolean => {
    if (!input) return true;

    // Check for potential XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        detectSecurityViolation('xss_attempt', {
          context,
          inputLength: input.length,
          pattern: pattern.source
        });
        return false;
      }
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(from|where|into|values|table)\b)/gi,
      /('.*?'.*?;.*?--)/gi,
      /(\/\*.*?\*\/)/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        detectSecurityViolation('sql_injection_attempt', {
          context,
          inputLength: input.length,
          pattern: pattern.source
        });
        return false;
      }
    }

    return true;
  }, [detectSecurityViolation]);

  // Rate limiting with enhanced tracking
  const checkSecureRateLimit = useCallback((operation: string, maxAttempts: number = 5): boolean => {
    const key = `${operation}_${user?.id || 'anonymous'}`;
    const allowed = checkRateLimit(key, maxAttempts);
    
    if (!allowed) {
      detectSecurityViolation('rate_limit_exceeded', {
        operation,
        maxAttempts,
        userId: user?.id
      });
    }
    
    return allowed;
  }, [checkRateLimit, detectSecurityViolation, user?.id]);

  // Session security monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      metricsRef.current.activityCount++;
      metricsRef.current.lastActivity = Date.now();
    };

    // Monitor user activity
    const events = ['click', 'keypress', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodic CSRF token refresh
    const tokenRefreshInterval = setInterval(() => {
      refreshCSRFToken();
    }, 15 * 60 * 1000); // Every 15 minutes

    // Session timeout monitoring
    const sessionCheckInterval = setInterval(() => {
      const sessionDuration = Date.now() - metricsRef.current.sessionStartTime;
      const inactiveTime = Date.now() - metricsRef.current.lastActivity;
      
      // Log unusual session patterns
      if (sessionDuration > 8 * 60 * 60 * 1000) { // 8 hours
        logSecurityEvent(
          'long_session',
          'Unusually long session detected',
          {
            sessionDuration: sessionDuration / 1000 / 60, // minutes
            userId: user?.id
          },
          'info'
        );
      }

      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes inactive
        logSecurityEvent(
          'session_inactive',
          'Session inactive for extended period',
          {
            inactiveTime: inactiveTime / 1000 / 60, // minutes
            userId: user?.id
          },
          'info'
        );
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(tokenRefreshInterval);
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated, user?.id, refreshCSRFToken]);

  return {
    validateSecureInput,
    checkSecureRateLimit,
    detectSecurityViolation,
    getSecurityMetrics: () => ({ ...metricsRef.current })
  };
};