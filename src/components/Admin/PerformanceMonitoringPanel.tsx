
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  HardDrive,
  X
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

export const PerformanceMonitoringPanel: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { metrics, alerts, getSlowComponents, clearAlerts } = usePerformanceMonitoring();

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const slowComponents = getSlowComponents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.performance.title')}</h2>
          <p className="text-muted-foreground">{t('admin.performance.description')}</p>
        </div>
        {alerts.length > 0 && (
          <Button onClick={clearAlerts} size="sm" variant="outline">
            <X className="h-4 w-4 mr-2" />
            {t('admin.performance.clearAlerts')} ({alerts.length})
          </Button>
        )}
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('admin.performance.performanceAlerts')}</h3>
          {alerts.slice(-5).map((alert, index) => (
            <Alert 
              key={index}
              variant={alert.severity === 'high' ? 'destructive' : 'default'}
              className={alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' : ''}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{alert.message}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity === 'high' ? t('admin.performance.high') :
                     alert.severity === 'medium' ? t('admin.performance.medium') :
                     t('admin.performance.low')}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.performance.avgQueryTime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.averageQueryTime)}ms
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.totalOperations} {t('admin.performance.operations')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.performance.errorRate')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.errorRate.toFixed(1)}%
            </div>
            <Progress 
              value={Math.min(metrics.errorRate, 100)} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.performance.memoryUsage')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.memoryUsage.toFixed(1)}%
            </div>
            <Progress 
              value={metrics.memoryUsage}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.performance.slowQueries')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.slowQueries.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {'>'}{2}{t('admin.performance.responseTime')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slow Queries */}
      {metrics.slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.performance.recentSlowQueries')}</CardTitle>
            <CardDescription>{t('admin.performance.queriesSlowerThan')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.slowQueries.slice(-10).map((query, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{query.query}</span>
                    <div className="text-xs text-muted-foreground">
                      {query.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(query.time)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow Components */}
      {slowComponents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.performance.slowRenderingComponents')}</CardTitle>
            <CardDescription>{t('admin.performance.componentsSlowerThan')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slowComponents.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{component.component}</span>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {t('admin.performance.avg')}: {Math.round(component.averageTime)}ms
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {t('admin.performance.max')}: {Math.round(component.maxTime)}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
