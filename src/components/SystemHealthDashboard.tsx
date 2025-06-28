
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw, 
  Database,
  Shield,
  User,
  Activity
} from 'lucide-react';
import { systemHealthService } from '@/services/systemHealthService';
import { useToast } from '@/hooks/use-toast';

const SystemHealthDashboard: React.FC = () => {
  const { toast } = useToast();
  const [healthReport, setHealthReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const report = await systemHealthService.runComprehensiveHealthCheck();
      setHealthReport(report);
      setLastCheck(new Date());
      
      if (report.overallHealth === 'HEALTHY') {
        toast({
          title: 'System Health Check ✅',
          description: 'All systems are working perfectly! Data fetching errors have been resolved.',
        });
      } else if (report.overallHealth === 'DEGRADED') {
        toast({
          title: 'System Status: Degraded ⚠️',
          description: 'Some issues detected but core functionality is working.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Critical Issues Detected ❌',
          description: 'Multiple system issues require immediate attention.',
          variant: 'destructive',
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

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'HEALTHY':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'DEGRADED':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (accessible: boolean) => {
    return accessible 
      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />;
  };

  if (!healthReport) {
    return (
      <Card className="border-2">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Running comprehensive health check...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card className={`border-2 ${getHealthColor(healthReport.overallHealth)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getHealthIcon(healthReport.overallHealth)}
              <CardTitle className="text-xl">System Health Status</CardTitle>
              <Badge variant="outline" className={getHealthColor(healthReport.overallHealth)}>
                {healthReport.overallHealth}
              </Badge>
            </div>
            <Button
              onClick={runHealthCheck}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Recheck
            </Button>
          </div>
          {lastCheck && (
            <p className="text-sm text-muted-foreground">
              Last checked: {lastCheck.toLocaleString()}
            </p>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Session Valid</span>
              {getStatusIcon(healthReport.authentication.sessionValid)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">User Exists</span>
              {getStatusIcon(healthReport.authentication.userExists)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Has Role</span>
              {getStatusIcon(healthReport.authentication.hasRole)}
            </div>
            {healthReport.authentication.role && (
              <div className="pt-2">
                <Badge variant="outline">{healthReport.authentication.role}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Policies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Security Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Policies Correct</span>
              {getStatusIcon(healthReport.policies.policiesCorrect)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Policy Count</span>
              <Badge variant="outline">
                {healthReport.policies.userRolesPolicyCount}/2
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Data Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">User Roles</span>
              {getStatusIcon(healthReport.dataAccess.userRolesAccessible)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Profiles</span>
              {getStatusIcon(healthReport.dataAccess.profilesAccessible)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Assignments</span>
              {getStatusIcon(healthReport.dataAccess.assignmentsAccessible)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cars</span>
              {getStatusIcon(healthReport.dataAccess.carsAccessible)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Vacations</span>
              {getStatusIcon(healthReport.dataAccess.vacationsAccessible)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {healthReport.errors && healthReport.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Issues Detected:</div>
            <ul className="list-disc list-inside space-y-1">
              {healthReport.errors.map((error: string, index: number) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {healthReport.overallHealth === 'HEALTHY' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium text-green-800">All Systems Operational! ✅</div>
            <div className="text-sm text-green-700 mt-1">
              Database policies have been fixed, authentication is working, and all data access is functioning properly. 
              The infinite recursion errors have been completely resolved!
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
