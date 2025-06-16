
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SystemHealth {
  status: string;
  timestamp: string;
  policy_count: number;
  function_count: number;
  table_count: number;
  rls_enabled_tables: number;
}

interface SecurityMetrics {
  totalSecurityEvents: number;
  recentErrors: number;
  systemHealth: SystemHealth | null;
  lastHealthCheck: Date | null;
}

export const useSystemHealthMonitoring = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalSecurityEvents: 0,
    recentErrors: 0,
    systemHealth: null,
    lastHealthCheck: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSystemHealth = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useSystemHealthMonitoring] Checking system health...');
      
      // Check system health using our new function
      const { data: healthData, error: healthError } = await supabase
        .rpc('check_system_health');
      
      if (healthError) {
        console.error('[useSystemHealthMonitoring] Health check error:', healthError);
        throw healthError;
      }
      
      // Get security event counts
      const { count: totalEvents, error: eventsError } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true });
      
      if (eventsError) {
        console.warn('[useSystemHealthMonitoring] Could not fetch event count:', eventsError);
      }
      
      // Get recent error count (last 24 hours)
      const { count: recentErrorCount, error: recentError } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .in('event_type', ['security_error', 'logging_error', 'auth_failure']);
      
      if (recentError) {
        console.warn('[useSystemHealthMonitoring] Could not fetch recent errors:', recentError);
      }
      
      setMetrics({
        totalSecurityEvents: totalEvents || 0,
        recentErrors: recentErrorCount || 0,
        systemHealth: healthData as SystemHealth,
        lastHealthCheck: new Date()
      });
      
      console.log('[useSystemHealthMonitoring] System health check completed:', healthData);
      
    } catch (err) {
      console.error('[useSystemHealthMonitoring] System health check failed:', err);
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh health check every 5 minutes
  useEffect(() => {
    if (!user) return;
    
    // Initial check
    checkSystemHealth();
    
    // Set up interval for periodic checks
    const interval = setInterval(checkSystemHealth, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user, checkSystemHealth]);

  return {
    metrics,
    loading,
    error,
    checkSystemHealth,
    isHealthy: metrics.systemHealth?.status === 'healthy'
  };
};
