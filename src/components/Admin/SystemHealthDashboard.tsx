
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Database, AlertTriangle, CheckCircle2, RefreshCw, Activity } from 'lucide-react';
import { useSystemHealthMonitoring } from '@/hooks/useSystemHealthMonitoring';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

export const SystemHealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { metrics, loading, error, checkSystemHealth, isHealthy } = useSystemHealthMonitoring();
  
  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const getHealthStatusColor = () => {
    if (isHealthy) return 'text-green-600';
    if (metrics.recentErrors > 5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getHealthStatusText = () => {
    if (isHealthy && metrics.recentErrors === 0) return 'Excellent';
    if (isHealthy && metrics.recentErrors <= 2) return 'Good';
    if (metrics.recentErrors <= 5) return 'Warning';
    return 'Critical';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.systemHealth.dashboard')}</h2>
          <p className="text-muted-foreground">{t('admin.systemHealth.dashboardDesc')}</p>
        </div>
        <Button 
          onClick={checkSystemHealth} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.common.refresh')}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{t('admin.systemHealth.healthCheckFailed')}: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.systemHealth.systemStatus')}</CardTitle>
            {isHealthy && metrics.recentErrors <= 2 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isHealthy && metrics.recentErrors <= 2 ? "default" : "secondary"}>
                {getHealthStatusText()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('admin.systemHealth.lastChecked')}: {metrics.lastHealthCheck?.toLocaleTimeString() || t('admin.systemHealth.never')}
            </p>
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.systemHealth.securityEvents')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSecurityEvents}</div>
            <p className={`text-xs ${metrics.recentErrors > 5 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {metrics.recentErrors} {t('admin.systemHealth.errorsIn24h')}
            </p>
          </CardContent>
        </Card>

        {/* Database Policies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.systemHealth.rlsPolicies')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.systemHealth?.policy_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.systemHealth?.rls_enabled_tables || 0} {t('admin.systemHealth.securedTables')}
            </p>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthStatusColor()}`}>
              {metrics.recentErrors === 0 ? '100%' : `${Math.max(0, 100 - metrics.recentErrors * 5)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              System uptime score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Information */}
      {metrics.systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.systemHealth.systemDetails')}</CardTitle>
            <CardDescription>
              Comprehensive system health overview and security metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">{t('admin.systemHealth.databaseStatistics')}</h4>
                <ul className="space-y-1 text-sm">
                  <li>{t('admin.systemHealth.tables')}: {metrics.systemHealth.table_count}</li>
                  <li>{t('admin.systemHealth.functions')}: {metrics.systemHealth.function_count}</li>
                  <li>{t('admin.systemHealth.rlsPolicies')}: {metrics.systemHealth.policy_count}</li>
                  <li>{t('admin.systemHealth.securedTables')}: {metrics.systemHealth.rls_enabled_tables}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('admin.systemHealth.securityOverview')}</h4>
                <ul className="space-y-1 text-sm">
                  <li>{t('admin.systemHealth.totalEvents')}: {metrics.totalSecurityEvents}</li>
                  <li className={metrics.recentErrors > 5 ? 'text-red-600' : ''}>
                    {t('admin.systemHealth.recentErrors')}: {metrics.recentErrors}
                  </li>
                  <li>{t('admin.common.status')}: {getHealthStatusText()}</li>
                  <li>{t('admin.systemHealth.lastCheck')}: {new Date(metrics.systemHealth.timestamp).toLocaleString()}</li>
                </ul>
              </div>
            </div>
            
            {metrics.recentErrors > 5 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">High Error Rate Detected</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  System has logged {metrics.recentErrors} errors in the last 24 hours. Please review security logs for details.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
