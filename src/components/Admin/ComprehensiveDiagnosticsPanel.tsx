
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Shield,
  Database,
  Users,
  Zap
} from 'lucide-react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
};

const getCategoryIcon = (category: string) => {
  const iconClass = "h-4 w-4 text-muted-foreground";
  switch (category.toLowerCase()) {
    case 'database':
      return <Database className={iconClass} />;
    case 'authentication':
      return <Shield className={iconClass} />;
    case 'user_roles':
      return <Users className={iconClass} />;
    case 'realtime':
      return <Zap className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
};

export const ComprehensiveDiagnosticsPanel: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { diagnostics, runDiagnostics, isHealthy } = useDiagnostics();

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.diagnostics.title')}</h2>
          <p className="text-muted-foreground">{t('admin.diagnostics.description')}</p>
        </div>
        <Button 
          onClick={runDiagnostics} 
          disabled={diagnostics.isLoading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${diagnostics.isLoading ? 'animate-spin' : ''}`} />
          {t('admin.diagnostics.runDiagnostics')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.diagnostics.overallStatus')}</CardTitle>
            {isHealthy ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isHealthy ? "default" : "destructive"}>
                {isHealthy ? t('admin.diagnostics.healthy') : t('admin.diagnostics.issuesDetected')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.diagnostics.totalIssues')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics.totalIssues}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.diagnostics.critical')}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{diagnostics.criticalIssues}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.diagnostics.warnings')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{diagnostics.warningIssues}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.diagnostics.diagnosticResults')}</CardTitle>
          <CardDescription>
            {t('admin.diagnostics.lastRun')}: {diagnostics.lastRun?.toLocaleString() || t('admin.diagnostics.never')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {diagnostics.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>{t('admin.diagnostics.runningDiagnostics')}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {diagnostics.results.map((result, index) => (
                <Alert 
                  key={index} 
                  variant={result.status === 'fail' ? 'destructive' : 'default'}
                  className={result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
                >
                  <div className="flex items-start space-x-3">
                    {getCategoryIcon(result.category)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.category.replace('_', ' ')}</span>
                        <Badge 
                          variant={
                            result.status === 'pass' ? 'default' : 
                            result.status === 'fail' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {result.status === 'pass' ? t('admin.diagnostics.pass') :
                           result.status === 'fail' ? t('admin.diagnostics.fail') :
                           t('admin.diagnostics.warning')}
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm">
                        {result.message}
                      </AlertDescription>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground">
                            {t('admin.diagnostics.showDetails')}
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
