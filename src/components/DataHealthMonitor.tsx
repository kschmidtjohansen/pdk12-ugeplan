
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
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
        unifiedDataService.verifyCompleteFix()
      ]);
      
      setHealthData(health);
      setVerificationData(verification);
      setLastCheck(new Date());
      
      if (verification?.fix_status === 'SUCCESS' && verification?.system_health === 'HEALTHY') {
        toast({
          title: 'Database Fix Verified ✅',
          description: `All systems healthy! Clean policies working perfectly. Policy count: ${verification.policy_count}/2`,
        });
      } else {
        toast({
          title: 'System Status Update',
          description: `Fix: ${verification?.fix_status || 'UNKNOWN'}, Health: ${verification?.system_health || 'UNKNOWN'}`,
          variant: verification?.fix_status === 'SUCCESS' ? 'default' : 'destructive',
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
      description: 'All circuit breakers reset. Clean database policies active!',
    });
  };

  const clearCache = () => {
    unifiedDataService.clearCache();
    toast({
      title: 'Cache Cleared',
      description: 'Data cache cleared. Fresh data will load with clean policies.',
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

  // Don't show on dashboard if everything is working perfectly
  if (showInDashboard && 
      verificationData?.fix_status === 'SUCCESS' && 
      verificationData?.system_health === 'HEALTHY' &&
      !healthData?.profiles_error && 
      !healthData?.assignments_error && 
      !healthData?.cars_error &&
      !healthData?.user_roles_error) {
    return null;
  }

  return (
    <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">System Health Monitor</CardTitle>
            {verificationData?.fix_status === 'SUCCESS' && (
              <Badge variant="default" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Fixed
              </Badge>
            )}
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
              <div className="font-medium">Clean Database Policy Status</div>
              <div className="text-sm mt-1">
                Policy Count: {verificationData.policy_count}/2 |
                Fix Status: <Badge variant={verificationData.fix_status === 'SUCCESS' ? 'default' : 'destructive'}>
                  {verificationData.fix_status}
                </Badge>
                {verificationData.system_health && (
                  <span className="ml-2">
                    System Health: <Badge variant={verificationData.system_health === 'HEALTHY' ? 'default' : 'secondary'}>
                      {verificationData.system_health}
                    </Badge>
                  </span>
                )}
                {verificationData.current_role && (
                  <span className="ml-2">
                    Current Role: <Badge variant="outline">{verificationData.current_role}</Badge>
                  </span>
                )}
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

        {/* Success Message */}
        {verificationData?.fix_status === 'SUCCESS' && verificationData?.system_health === 'HEALTHY' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-green-800">Database Fix Successful! ✅</div>
              <div className="text-sm text-green-700 mt-1">
                All systems are now working with clean, non-recursive policies. Data fetching should work perfectly!
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DataHealthMonitor;
