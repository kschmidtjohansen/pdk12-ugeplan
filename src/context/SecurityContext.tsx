import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { generateCSRFToken, ClientRateLimit } from '@/utils/inputSanitization';
import { AuditLogger } from '@/utils/auditLogger';
import { securityLog } from '@/utils/secureLogger';

interface SecurityContextType {
  csrfToken: string;
  refreshCSRFToken: () => void;
  checkRateLimit: (key: string, maxAttempts?: number) => boolean;
  resetRateLimit: (key: string) => void;
  isSecureContext: boolean;
  logAdminAction: (action: string, resource: string, resourceId?: string, details?: Record<string, any>) => Promise<void>;
  logVacationAction: (action: 'create' | 'approve' | 'reject' | 'delete' | 'update', vacationId: string, details?: Record<string, any>) => Promise<void>;
  logAssignmentAction: (action: 'create' | 'update' | 'delete' | 'publish', assignmentId: string, details?: Record<string, any>) => Promise<void>;
  logSecurityEvent: (event: string, details?: Record<string, any>, severity: 'info' | 'warning' | 'error' | 'critical' = 'warning') => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType>({
  csrfToken: '',
  refreshCSRFToken: () => {},
  checkRateLimit: () => true,
  resetRateLimit: () => {},
  isSecureContext: false,
  logAdminAction: () => Promise.resolve(),
  logVacationAction: () => Promise.resolve(),
  logAssignmentAction: () => Promise.resolve(),
  logSecurityEvent: () => Promise.resolve(),
});

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [csrfToken, setCSRFToken] = useState<string>('');
  const [rateLimit] = useState(() => new ClientRateLimit());
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);

  const refreshCSRFToken = () => {
    const newToken = generateCSRFToken();
    setCSRFToken(newToken);
    // Store in sessionStorage for validation
    try {
      sessionStorage.setItem('csrf_token', newToken);
    } catch (error) {
      console.warn('Unable to store CSRF token:', error);
    }
  };

  const checkRateLimit = (key: string, maxAttempts: number = 5): boolean => {
    return rateLimit.check(key, maxAttempts);
  };

  const resetRateLimit = (key: string): void => {
    rateLimit.reset(key);
  };

  const logAdminAction = useCallback(async (
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    await AuditLogger.logAdminAction(action, resource, resourceId, details);
  }, []);

  const logVacationAction = useCallback(async (
    action: 'create' | 'approve' | 'reject' | 'delete' | 'update',
    vacationId: string,
    details?: Record<string, any>
  ) => {
    await AuditLogger.logVacationAction(action, vacationId, details);
  }, []);

  const logAssignmentAction = useCallback(async (
    action: 'create' | 'update' | 'delete' | 'publish',
    assignmentId: string,
    details?: Record<string, any>
  ) => {
    await AuditLogger.logAssignmentAction(action, assignmentId, details);
  }, []);

  const logSecurityEvent = useCallback(async (
    event: string,
    details?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'warning'
  ) => {
    await AuditLogger.logSecurityEvent(event, details, severity);
  }, []);

  useEffect(() => {
    // Initialize CSRF token
    refreshCSRFToken();
    
    // Check if we're in a secure context
    setIsSecureContext(
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost'
    );

    // Refresh CSRF token periodically (every 30 minutes)
    const interval = setInterval(refreshCSRFToken, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced audit logging for admin actions
  const monitorSuspiciousActivity = () => {
    // Monitor for rapid-fire requests
    const requestTimes: number[] = [];
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      const now = Date.now();
      requestTimes.push(now);
      
      // Remove requests older than 1 minute
      const oneMinuteAgo = now - 60000;
      const recentRequests = requestTimes.filter(time => time > oneMinuteAgo);
      
      // If more than 100 requests in 1 minute, log suspicious activity
      if (recentRequests.length > 100) {
        securityLog('suspicious_activity_detected', {
          requestCount: recentRequests.length,
          timeWindow: '1 minute',
          timestamp: new Date().toISOString()
        });
      }
      
      return originalFetch.apply(this, args);
    };
  };

  useEffect(() => {
    monitorSuspiciousActivity();
  }, []);

  // Log security warnings for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isSecureContext) {
      console.warn(
        '[Security Warning] Not in secure context. HTTPS should be used in production.'
      );
    }
  }, [isSecureContext]);

  const value = {
    csrfToken,
    refreshCSRFToken,
    checkRateLimit,
    resetRateLimit,
    isSecureContext,
    logAdminAction,
    logVacationAction,
    logAssignmentAction,
    logSecurityEvent
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
