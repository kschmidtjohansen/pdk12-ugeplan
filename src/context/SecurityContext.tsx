
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { securityLog } from '@/utils/securityLogger';

interface SecurityContextType {
  csrfToken: string;
  isSecureContext: boolean;
  checkRateLimit: (action: string, limit: number) => boolean;
  reportSecurityIncident: (incident: string, details?: Record<string, any>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [csrfToken] = useState(() => crypto.getRandomValues(new Uint32Array(4)).join('-'));
  const [rateLimitData, setRateLimitData] = useState<Record<string, number[]>>({});

  const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  const checkRateLimit = (action: string, limit: number): boolean => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    const actionData = rateLimitData[action] || [];
    const recentAttempts = actionData.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= limit) {
      securityLog('Rate limit exceeded', { action, attempts: recentAttempts.length, limit });
      return false;
    }
    
    setRateLimitData(prev => ({
      ...prev,
      [action]: [...recentAttempts, now]
    }));
    
    return true;
  };

  const reportSecurityIncident = (incident: string, details: Record<string, any> = {}) => {
    securityLog(`Security incident: ${incident}`, details);
  };

  useEffect(() => {
    // Security monitoring setup
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      reportSecurityIncident('CSP Violation', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile
      });
    };

    if ('SecurityPolicyViolationEvent' in window) {
      document.addEventListener('securitypolicyviolation', handleSecurityViolation as EventListener);
    }

    return () => {
      if ('SecurityPolicyViolationEvent' in window) {
        document.removeEventListener('securitypolicyviolation', handleSecurityViolation as EventListener);
      }
    };
  }, []);

  const value: SecurityContextType = {
    csrfToken,
    isSecureContext,
    checkRateLimit,
    reportSecurityIncident
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
