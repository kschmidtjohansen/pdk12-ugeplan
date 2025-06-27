
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Database,
  Shield,
  Activity,
  Clock
} from 'lucide-react';
import { unifiedDataService } from '@/services/unifiedDataService';
import { useToast } from '@/hooks/use-toast';

interface DataHealthMonitorProps {
  showInDashboard?: boolean;
}

const DataHealthMonitor: React.FC<DataHealthMonitorProps> = ({ showInDashboard = false }) => {
  const { toast } = useToast();
  const [healthData, setHealthData] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const [health, verification] = await Promise.all([
        unifiedDataService.checkSystemHealth(),
        unifiedDataService.verifyDatabaseFix()
      ]);
      
      setHealthData(health);
      setVerificationData(verification);
      setLastCheck(new Date());
      
      if (verification?.fix_status === 'SUCCESS') {
        toast({
          title: 'Database Fix Verified',
          description: 'All RLS policies are working correctly!',
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: 'Health Check Failed',
        description: 'Could not complete system health check',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetCircuitBreakers = () => {
    unifiedDataService.resetAllCircuitBreakers();
    toast({
      title: 'Circuit Breakers Reset',
      description: 'All circuit breakers have been reset. Try loading data again.',
    });
  };

  const clearCache = () => {
    unifiedDataService.clearCache();
    toast({
      title: 'Cache Cleared',
      description: 'Data cache has been cleared. Fresh data will be loaded.',
    });
  };

  useEffect(() => {
    if (showInDashboard) {
      checkHealth();
    }
  }, [showInDashboard]);

  const getStatusColor = (accessible: boolean | undefined) => {
    if (accessible === undefined) return 'bg-gray-500';
    return accessible ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (accessible: boolean | undefined) => {
    if (accessible === undefined) return 'Unknown';
    return accessible ? 'OK' : 'Error';
  };

  if (showInDashboard && (!healthData || verificationData?.fix_status === 'SUCCESS')) {
    return null; // Don't show on dashboard if everything is working
  }

  return (
    <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">System Health Monitor</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={checkHealth}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Check Health
            </Button>
          </div>
        </div>
        {lastCheck && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Database Fix Verification */}
        {verificationData && (
          <Alert className={verificationData.fix_status === 'SUCCESS' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Database Policy Fix Status</div>
              <div className="text-sm mt-1">
                Policy Count: {verificationData.user_roles_policy_count}/2 |
                Status: <Badge variant={verificationData.fix_status === 'SUCCESS' ? 'default' : 'destructive'}>
                  {verificationData.fix_status}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Access Status */}
        {healthData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">User Roles</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(verificationData?.user_roles_accessible)}`}></div>
                <span className="text-sm">{getStatusText(verificationData?.user_roles_accessible)}</span>
              </div>
              {verificationData?.user_roles_count !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Count: {verificationData.user_roles_count}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Profiles</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(healthData.profiles_accessible)}`}></div>
                <span className="text-sm">{getStatusText(healthData.profiles_accessible)}</span>
              </div>
              {healthData.profiles_count !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Count: {healthData.profiles_count}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Assignments</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(healthData.assignments_accessible)}`}></div>
                <span className="text-sm">{getStatusText(healthData.assignments_accessible)}</span>
              </div>
              {healthData.assignments_count !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Count: {healthData.assignments_count}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Cars</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(healthData.cars_accessible)}`}></div>
                <span className="text-sm">{getStatusText(healthData.cars_accessible)}</span>
              </div>
              {healthData.cars_count !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Count: {healthData.cars_count}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            onClick={resetCircuitBreakers}
            size="sm"
            variant="outline"
          >
            Reset Circuit Breakers
          </Button>
          <Button
            onClick={clearCache}
            size="sm"
            variant="outline"
          >
            Clear Cache
          </Button>
        </div>

        {/* Error Details */}
        {(healthData?.profiles_error || healthData?.assignments_error || healthData?.cars_error || verificationData?.user_roles_error) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Errors detected:</div>
              <div className="text-sm mt-1 space-y-1">
                {verificationData?.user_roles_error && <div>User Roles: {verificationData.user_roles_error}</div>}
                {healthData?.profiles_error && <div>Profiles: {healthData.profiles_error}</div>}
                {healthData?.assignments_error && <div>Assignments: {healthData.assignments_error}</div>}
                {healthData?.cars_error && <div>Cars: {healthData.cars_error}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DataHealthMonitor;
