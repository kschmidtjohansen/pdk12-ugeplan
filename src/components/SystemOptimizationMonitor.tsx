import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface OptimizationStatus {
  total_logs: number;
  cleanup_completed: boolean;
  last_cleanup: string;
  performance_optimized: boolean;
}

export const SystemOptimizationMonitor: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<OptimizationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const checkOptimizationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check current log count
      const { count: logCount, error: countError } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Check if cleanup has been run recently
      const { data: cleanupLogs, error: cleanupError } = await supabase
        .from('logs')
        .select('created_at')
        .eq('event_type', 'emergency_log_cleanup')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (cleanupError) throw cleanupError;
      
      setStatus({
        total_logs: logCount || 0,
        cleanup_completed: (logCount || 0) < 1000,
        last_cleanup: cleanupLogs?.[0]?.created_at || 'Never',
        performance_optimized: (logCount || 0) < 500
      });
      
    } catch (err) {
      console.error('[SystemOptimizationMonitor] Error:', err);
      setError(t('admin.optimization.checkError') || 'Failed to check optimization status');
    } finally {
      setLoading(false);
    }
  };

  const runEmergencyCleanup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('emergency_log_cleanup');
      
      if (error) throw error;
      
      console.log('[SystemOptimizationMonitor] Cleanup completed:', data);
      
      // Refresh status after cleanup
      setTimeout(checkOptimizationStatus, 1000);
      
    } catch (err) {
      console.error('[SystemOptimizationMonitor] Cleanup error:', err);
      setError(t('admin.optimization.cleanupError') || 'Failed to run emergency cleanup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOptimizationStatus();
  }, []);

  const getStatusColor = () => {
    if (!status) return 'text-muted-foreground';
    if (status.performance_optimized) return 'text-green-600';
    if (status.cleanup_completed) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!status) return <RefreshCw className="h-4 w-4" />;
    if (status.performance_optimized) return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!status) return 'Checking...';
    if (status.performance_optimized) return 'Optimized';
    if (status.cleanup_completed) return 'Needs Optimization';
    return 'Critical Issues';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Optimization Status</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </Badge>
            <Button variant="outline" size="icon" onClick={checkOptimizationStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {status && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Logs:</span>
                <Badge variant={status.total_logs > 1000 ? 'destructive' : status.total_logs > 500 ? 'secondary' : 'default'}>
                  {status.total_logs.toLocaleString()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Cleanup:</span>
                <span className="text-sm text-muted-foreground">
                  {status.last_cleanup === 'Never' ? 'Never' : new Date(status.last_cleanup).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {status.total_logs > 500 && (
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  High log count detected ({status.total_logs.toLocaleString()} logs). 
                  Consider running emergency cleanup to improve performance.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={runEmergencyCleanup} 
                disabled={loading}
                variant={status.total_logs > 1000 ? 'destructive' : 'outline'}
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-2" />
                Run Emergency Cleanup
              </Button>
              
              <Button 
                onClick={checkOptimizationStatus} 
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin'  : ''}`} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};