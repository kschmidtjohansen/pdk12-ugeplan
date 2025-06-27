
import { supabase } from '@/integrations/supabase/client';
import { securityLog, secureError } from './secureLogger';

export class SessionSecurity {
  private static readonly MAX_CONCURRENT_SESSIONS = 3;
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static sessionCheckInterval: number | null = null;

  // Initialize session security monitoring
  static initialize(): void {
    this.startSessionMonitoring();
    this.setupStorageListener();
    this.checkConcurrentSessions();
  }

  // Start monitoring session validity
  private static startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = window.setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          securityLog('session_check_error', { error: error.message });
          this.handleSessionExpiry();
          return;
        }

        if (!session) {
          securityLog('session_expired', { timestamp: new Date().toISOString() });
          this.handleSessionExpiry();
          return;
        }

        // Check if session is expired
        const now = Date.now();
        const sessionTime = new Date(session.expires_at || 0).getTime();
        
        if (sessionTime < now) {
          securityLog('session_token_expired', { 
            expiresAt: session.expires_at,
            currentTime: new Date(now).toISOString()
          });
          this.handleSessionExpiry();
        }
      } catch (error) {
        secureError('Session monitoring error', error);
      }
    }, 60000); // Check every minute
  }

  // Handle session expiry
  private static handleSessionExpiry(): void {
    securityLog('handling_session_expiry');
    
    // Clear sensitive data from localStorage
    this.clearSensitiveStorage();
    
    // Sign out user
    supabase.auth.signOut().catch(error => {
      secureError('Error during forced signout', error);
    });
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Setup storage listener for multi-tab logout
  private static setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === 'supabase.auth.token' && !event.newValue) {
        securityLog('multi_tab_logout_detected');
        window.location.reload();
      }
    });
  }

  // Check concurrent sessions (basic implementation)
  private static async checkConcurrentSessions(): Promise<void> {
    try {
      const sessionId = this.generateSessionId();
      const sessionData = {
        id: sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substring(0, 100)
      };

      // Store session info (you might want to implement server-side session tracking)
      const existingSessions = JSON.parse(
        localStorage.getItem('user_sessions') || '[]'
      );

      // Clean old sessions
      const validSessions = existingSessions.filter((session: any) => 
        Date.now() - session.timestamp < this.SESSION_TIMEOUT
      );

      if (validSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
        securityLog('max_concurrent_sessions_exceeded', {
          currentSessions: validSessions.length,
          maxAllowed: this.MAX_CONCURRENT_SESSIONS
        });
        
        // Optionally force logout of oldest session
        validSessions.shift();
      }

      validSessions.push(sessionData);
      localStorage.setItem('user_sessions', JSON.stringify(validSessions));
      
    } catch (error) {
      secureError('Error checking concurrent sessions', error);
    }
  }

  // Generate session ID
  private static generateSessionId(): string {
    return crypto.getRandomValues(new Uint32Array(4)).join('-');
  }

  // Clear sensitive data from storage
  private static clearSensitiveStorage(): void {
    const sensitiveKeys = [
      'user_sessions',
      'temp_password',
      'remember_me',
      'last_auth_attempt'
    ];

    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    securityLog('sensitive_storage_cleared');
  }

  // Force logout all sessions
  static async forceLogoutAllSessions(): Promise<void> {
    try {
      // Clear all stored sessions
      localStorage.removeItem('user_sessions');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear sensitive storage
      this.clearSensitiveStorage();
      
      securityLog('forced_logout_all_sessions');
      
    } catch (error) {
      secureError('Error forcing logout of all sessions', error);
    }
  }

  // Cleanup on app unmount
  static cleanup(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}
