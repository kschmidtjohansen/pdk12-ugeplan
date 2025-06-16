import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logSecurityEvent, logUnauthorizedAccess } from '@/utils/securityLogger';

interface SecurityConfig {
  enableThreatDetection: boolean;
  sessionTimeoutMinutes: number;
  maxIdleTimeMinutes: number;
  enableActivityLogging: boolean;
}

const defaultConfig: SecurityConfig = {
  enableThreatDetection: true,
  sessionTimeoutMinutes: 30,
  maxIdleTimeMinutes: 15,
  enableActivityLogging: true
};

export const useSecurityMonitoring = (config: Partial<SecurityConfig> = {}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const finalConfig = { ...defaultConfig, ...config };
  
  const lastActivityRef = useRef<number>(Date.now());
  const securityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const threatDetectionRef = useRef<{
    suspiciousActivities: Array<{ type: string; timestamp: number; details: any }>;
    rapidClicks: number;
    lastClickTime: number;
  }>({
    suspiciousActivities: [],
    rapidClicks: 0,
    lastClickTime: 0
  });

  // Track user activity for session management
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Detect suspicious activity patterns
  const detectSuspiciousActivity = useCallback((activityType: string, details: any = {}) => {
    if (!finalConfig.enableThreatDetection) return;

    const now = Date.now();
    const threat = threatDetectionRef.current;

    // Track rapid clicking (potential bot behavior)
    if (activityType === 'click') {
      if (now - threat.lastClickTime < 100) {
        threat.rapidClicks++;
        if (threat.rapidClicks > 10) {
          logSecurityEvent(
            'suspicious_activity',
            'Rapid clicking detected - possible bot behavior',
            { rapidClicks: threat.rapidClicks, timeWindow: now - threat.lastClickTime },
            'warning'
          );
          threat.rapidClicks = 0; // Reset after logging
        }
      } else {
        threat.rapidClicks = 0;
      }
      threat.lastClickTime = now;
    }

    // Track suspicious activities
    threat.suspiciousActivities.push({
      type: activityType,
      timestamp: now,
      details
    });

    // Clean old activities (keep last 5 minutes)
    threat.suspiciousActivities = threat.suspiciousActivities.filter(
      activity => now - activity.timestamp < 300000
    );

    // Detect patterns in suspicious activities
    const recentActivities = threat.suspiciousActivities.filter(
      activity => now - activity.timestamp < 60000
    );

    if (recentActivities.length > 20) {
      logSecurityEvent(
        'suspicious_activity',
        'High frequency of activities detected',
        { activitiesCount: recentActivities.length, activities: recentActivities.slice(-5) },
        'warning'
      );
    }
  }, [finalConfig.enableThreatDetection]);

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

  // Session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated || !finalConfig.enableActivityLogging) return;

    const checkSessionTimeout = () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const maxIdleTime = finalConfig.maxIdleTimeMinutes * 60 * 1000;

      if (idleTime > maxIdleTime) {
        logSecurityEvent(
          'auth_attempt',
          'Session expired due to inactivity',
          { idleTimeMinutes: Math.round(idleTime / 60000) },
          'info'
        );
        logout();
        return;
      }
    };

    // Check every minute
    securityTimerRef.current = setInterval(checkSessionTimeout, 60000);

    return () => {
      if (securityTimerRef.current) {
        clearInterval(securityTimerRef.current);
      }
    };
  }, [isAuthenticated, finalConfig, logout]);

  // Activity listeners for session management
  useEffect(() => {
    if (!isAuthenticated || !finalConfig.enableActivityLogging) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = (e: Event) => {
      updateActivity();
      if (finalConfig.enableThreatDetection) {
        detectSuspiciousActivity(e.type, {
          target: e.target instanceof Element ? e.target.tagName : 'unknown',
          timestamp: Date.now()
        });
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, finalConfig, updateActivity, detectSuspiciousActivity]);

  return {
    checkUnauthorizedAccess,
    detectSuspiciousActivity,
    updateActivity,
    lastActivity: lastActivityRef.current
  };
};
