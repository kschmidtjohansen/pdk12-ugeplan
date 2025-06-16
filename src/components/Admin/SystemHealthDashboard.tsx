
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Database, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useSystemHealthMonitoring } from '@/hooks/useSystemHealthMonitoring';
import { useAuth } from '@/context/AuthContext';

export const SystemHealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const { metrics, loading, error, checkSystemHealth, isHealthy } = useSystemHealthMonitoring();
  
  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health Dashboard</h2>
          <p className="text-muted-foreground">Monitor security and database status</p>
        </div>
        <Button 
          onClick={checkSystemHealth} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Health check failed: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {isHealthy ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isHealthy ? "default" : "secondary"}>
                {metrics.systemHealth?.status || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: {metrics.lastHealthCheck?.toLocaleTimeString() || 'Never'}
            </p>
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSecurityEvents}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.recentErrors} errors in last 24h
            </p>
          </CardContent>
        </Card>

        {/* Database Policies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RLS Policies</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.systemHealth?.policy_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.systemHealth?.rls_enabled_tables || 0} tables secured
            </p>
          </CardContent>
        </Card>

        {/* Database Functions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Functions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.systemHealth?.function_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.systemHealth?.table_count || 0} total tables
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Information */}
      {metrics.systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle>System Details</CardTitle>
            <CardDescription>
              Detailed information about the current system state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Database Statistics</h4>
                <ul className="space-y-1 text-sm">
                  <li>Tables: {metrics.systemHealth.table_count}</li>
                  <li>Functions: {metrics.systemHealth.function_count}</li>
                  <li>RLS Policies: {metrics.systemHealth.policy_count}</li>
                  <li>Secured Tables: {metrics.systemHealth.rls_enabled_tables}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Security Overview</h4>
                <ul className="space-y-1 text-sm">
                  <li>Total Events: {metrics.totalSecurityEvents}</li>
                  <li>Recent Errors: {metrics.recentErrors}</li>
                  <li>Status: {metrics.systemHealth.status}</li>
                  <li>Last Check: {new Date(metrics.systemHealth.timestamp).toLocaleString()}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
