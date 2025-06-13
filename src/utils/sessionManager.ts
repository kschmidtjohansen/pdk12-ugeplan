
import { supabase } from '@/integrations/supabase/client';

export class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  async trackSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      // Log session tracking to console for now since we don't have user_sessions table
      console.log('[SessionManager] Tracking session for user:', session.user.id);
      
      // TODO: When user_sessions table is added to database, uncomment below:
      /*
      const sessionData = {
        user_id: session.user.id,
        session_token: session.access_token.slice(-20), // Store partial token for identification
        last_activity: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };
      
      await supabase
        .from('user_sessions')
        .upsert(sessionData, { 
          onConflict: 'session_token',
          ignoreDuplicates: false 
        });
      */
      
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }
  
  private async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }
  
  startSessionTracking() {
    // Track session every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.trackSession();
    }, 5 * 60 * 1000);
    
    // Track initial session
    this.trackSession();
  }
  
  stopSessionTracking() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
  
  async invalidateSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('[SessionManager] Invalidating session for user:', session.user?.id);
        
        // TODO: When user_sessions table is added to database, uncomment below:
        /*
        const sessionToken = session.access_token.slice(-20);
        
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
        */
      }
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }
}

// Initialize session manager
export const sessionManager = SessionManager.getInstance();
