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
  enableThreatDetection: true,
  sessionTimeoutMinutes: 30,
  maxIdleTimeMinutes: 5, // Changed from 15 to 5 minutes
  enableActivityLogging: true
};

export const useSecurityMonitoring = (config: Partial<SecurityConfig> = {}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const finalConfig = { ...defaultConfig, ...config };
  
  const lastActivityRef = useRef<number>(Date.now());
  const securityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const threatDetectionRef = useRef<{
    suspiciousActivities: Array<{ type: string; timestamp: number; details: any }>;
    rapidClicks: number;
    lastClickTime: number;
    mouseMoveCount: number;
    lastMouseMoveTime: number;
  }>({
    suspiciousActivities: [],
    rapidClicks: 0,
    lastClickTime: 0,
    mouseMoveCount: 0,
    lastMouseMoveTime: 0
  });

  // Determine if current route should have extended session timeout
  const isScreenDisplayRoute = location.pathname === '/screen-display';
  const shouldExtendSession = isScreenDisplayRoute;
  
  // Use different idle time based on route
  const effectiveIdleTime = shouldExtendSession ? 60 : finalConfig.maxIdleTimeMinutes; // 60 minutes for screen display, 5 minutes for others

  // Track user activity for session management
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Log activity update for debugging
    if (shouldExtendSession) {
      console.log('[Security] Activity updated on screen display route - extended session active');
    }
  }, [shouldExtendSession]);

  // Improved suspicious activity detection with better thresholds
  const detectSuspiciousActivity = useCallback((activityType: string, details: any = {}) => {
    if (!finalConfig.enableThreatDetection) return;

    const now = Date.now();
    const threat = threatDetectionRef.current;

    // Handle mouse movements with realistic thresholds
    if (activityType === 'mousemove') {
      const timeSinceLastMove = now - threat.lastMouseMoveTime;
      
      // Only consider it suspicious if it's extremely rapid (less than 5ms between moves)
      // Normal mouse movement is 16-33ms between events
      if (timeSinceLastMove < 5 && timeSinceLastMove > 0) {
        threat.mouseMoveCount++;
        
        // Only log if we have sustained ultra-rapid movement (100+ events in rapid succession)
        if (threat.mouseMoveCount > 100) {
          logSecurityEvent(
            'suspicious_activity',
            'Ultra-rapid mouse movement detected - possible automation',
            { 
              mouseMoveCount: threat.mouseMoveCount, 
              avgInterval: timeSinceLastMove,
              timeWindow: '5ms threshold' 
            },
            'warning'
          );
          threat.mouseMoveCount = 0; // Reset after logging
        }
      } else {
        // Reset counter for normal mouse movement
        threat.mouseMoveCount = Math.max(0, threat.mouseMoveCount - 1);
      }
      
      threat.lastMouseMoveTime = now;
      return; // Don't add normal mouse moves to suspicious activities
    }

    // Handle clicks with improved thresholds
    if (activityType === 'mousedown') {
      const timeSinceLastClick = now - threat.lastClickTime;
      
      // Only consider clicks suspicious if they're under 50ms apart (inhuman speed)
      if (timeSinceLastClick < 50 && timeSinceLastClick > 0) {
        threat.rapidClicks++;
        
        // Require 20+ rapid clicks before flagging (was 10)
        if (threat.rapidClicks > 20) {
          logSecurityEvent(
            'suspicious_activity',
            'Rapid clicking detected - possible automation',
            { 
              rapidClicks: threat.rapidClicks, 
              avgInterval: timeSinceLastClick,
              threshold: '50ms' 
            },
            'warning'
          );
          threat.rapidClicks = 0; // Reset after logging
        }
      } else if (timeSinceLastClick > 200) {
        // Reset counter after normal pause between clicks
        threat.rapidClicks = 0;
      }
      
      threat.lastClickTime = now;
    }

    // Only track actually suspicious activities, not normal user interactions
    if (activityType !== 'mousemove' && activityType !== 'scroll' && activityType !== 'keypress') {
      threat.suspiciousActivities.push({
        type: activityType,
        timestamp: now,
        details
      });

      // Clean old activities (keep last 5 minutes)
      threat.suspiciousActivities = threat.suspiciousActivities.filter(
        activity => now - activity.timestamp < 300000
      );

      // Only alert on truly unusual patterns (increased threshold from 20 to 50)
      const recentActivities = threat.suspiciousActivities.filter(
        activity => now - activity.timestamp < 60000
      );

      if (recentActivities.length > 50) {
        logSecurityEvent(
          'suspicious_activity',
          'High frequency of unusual activities detected',
          { 
            activitiesCount: recentActivities.length, 
            activities: recentActivities.slice(-3), // Only show last 3 instead of 5
            threshold: '50 activities per minute'
          },
          'warning'
        );
        
        // Clear some activities to prevent spam
        threat.suspiciousActivities = threat.suspiciousActivities.slice(-10);
      }
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

  // Route-aware session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated || !finalConfig.enableActivityLogging) return;

    const checkSessionTimeout = () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const maxIdleTime = effectiveIdleTime * 60 * 1000;

      console.log(`[Security] Route: ${location.pathname}, Idle time: ${Math.round(idleTime / 60000)}min, Max: ${effectiveIdleTime}min, Extended: ${shouldExtendSession}`);

      // Skip logout on screen display route to keep it active
      if (shouldExtendSession) {
        console.log('[Security] Screen display route - skipping auto-logout');
        return;
      }

      if (idleTime > maxIdleTime) {
        logSecurityEvent(
          'auth_attempt',
          'Session expired due to inactivity',
          { 
            idleTimeMinutes: Math.round(idleTime / 60000),
            route: location.pathname,
            wasExtendedSession: shouldExtendSession
          },
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
  }, [isAuthenticated, finalConfig, logout, effectiveIdleTime, shouldExtendSession, location.pathname]);

  // Improved activity listeners with better filtering
  useEffect(() => {
    if (!isAuthenticated || !finalConfig.enableActivityLogging) return;

    // Throttle mouse move events to prevent spam
    let mouseMoveThrottle: NodeJS.Timeout | null = null;
    
    const handleActivity = (e: Event) => {
      updateActivity();
      
      if (!finalConfig.enableThreatDetection) return;

      // Throttle mouse moves to max once per 100ms to reduce false positives
      if (e.type === 'mousemove') {
        if (mouseMoveThrottle) return;
        
        mouseMoveThrottle = setTimeout(() => {
          mouseMoveThrottle = null;
          detectSuspiciousActivity(e.type, {
            target: e.target instanceof Element ? e.target.tagName : 'unknown',
            timestamp: Date.now()
          });
        }, 100);
      } else {
        // Handle other events normally
        detectSuspiciousActivity(e.type, {
          target: e.target instanceof Element ? e.target.tagName : 'unknown',
          timestamp: Date.now()
        });
      }
    };

    // Only monitor truly relevant events
    const activityEvents = ['mousedown', 'keypress', 'mousemove'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (mouseMoveThrottle) {
        clearTimeout(mouseMoveThrottle);
      }
    };
  }, [isAuthenticated, finalConfig, updateActivity, detectSuspiciousActivity]);

  return {
    checkUnauthorizedAccess,
    detectSuspiciousActivity,
    updateActivity,
    lastActivity: lastActivityRef.current,
    isExtendedSession: shouldExtendSession,
    effectiveIdleTimeMinutes: effectiveIdleTime
  };
};
