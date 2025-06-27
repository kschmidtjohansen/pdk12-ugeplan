
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { logSecurityEvent, logUnauthorizedAccess } from '@/utils/securityLogger';

interface SecurityConfig {
  enableThreatDetection: boolean;
  sessionTimeoutMinutes: number;
  maxIdleTimeMinutes: number;
  enableActivityLogging: boolean;
}

const defaultConfig: SecurityConfig = {
  enableThreatDetection: false, // Disabled to prevent interference with auth
  sessionTimeoutMinutes: 30,
  maxIdleTimeMinutes: 20,
  enableActivityLogging: false // Disabled to prevent interference with auth
};

export const useSecurityMonitoring = (config: Partial<SecurityConfig> = {}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const finalConfig = { ...defaultConfig, ...config };
  
  const lastActivityRef = useRef<number>(Date.now());

  // Determine if current route should have extended session timeout
  const isScreenDisplayRoute = location.pathname === '/screen-display';
  const shouldExtendSession = isScreenDisplayRoute;
  
  // Use different idle time based on route
  const effectiveIdleTime = shouldExtendSession ? 60 : finalConfig.maxIdleTimeMinutes;

  // Track user activity for session management
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Monitor for unauthorized access attempts
  const checkUnauthorizedAccess = useCallback((resource: string, requiredRole?: string) => {
    if (!user && isAuthenticated) {
      logUnauthorizedAccess(resource, 'access without proper authentication');
      return false;
    }

    if (requiredRole && user && user.role !== requiredRole && user.role !== 'administrator') {
      logUnauthorizedAccess(resource, `access with insufficient role: ${user.role}, required: ${requiredRole}`);
      return false;
    }

    return true;
  }, [user, isAuthenticated]);

  // Simplified activity detection (disabled by default)
  const detectSuspiciousActivity = useCallback((activityType: string, details: any = {}) => {
    if (!finalConfig.enableThreatDetection) return;
    
    // Only log truly suspicious activities
    if (activityType === 'rapid_requests' || activityType === 'unauthorized_access') {
      logSecurityEvent(
        'suspicious_activity',
        `Suspicious activity detected: ${activityType}`,
        details,
        'warning'
      );
    }
  }, [finalConfig.enableThreatDetection]);

  // Minimal activity listeners (disabled by default)
  useEffect(() => {
    if (!isAuthenticated || !finalConfig.enableActivityLogging) return;

    const handleActivity = () => {
      updateActivity();
    };

    // Only monitor key events
    const activityEvents = ['keypress', 'mousedown'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, finalConfig.enableActivityLogging, updateActivity]);

  return {
    checkUnauthorizedAccess,
    detectSuspiciousActivity,
    updateActivity,
    lastActivity: lastActivityRef.current,
    isExtendedSession: shouldExtendSession,
    effectiveIdleTimeMinutes: effectiveIdleTime
  };
};
