
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { unifiedDataService } from '@/services/data/unifiedDataService';

interface HealthStatusProps {
  cacheSize: number;
  cacheEntries: string[];
  healthMonitoring: boolean;
}

const DataHealthMonitor: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState<HealthStatusProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);
  const [rlsFixStatus, setRlsFixStatus] = useState<string>('unknown');

  const fetchDataHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test the RLS fix by trying to fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .limit(5);

      if (rolesError) {
        setRlsFixStatus('failed');
        console.error('[DataHealthMonitor] RLS fix test failed:', rolesError);
      } else {
        setRlsFixStatus('success');
        console.log('[DataHealthMonitor] RLS fix test passed, fetched', userRoles?.length, 'roles');
      }

      const status = unifiedDataService.getStatus();
      const healthStatusWithMonitoring = {
        ...status,
        healthMonitoring: true
      };
      setHealthStatus(healthStatusWithMonitoring);
      setIsHealthy(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health status';
      setError(errorMessage);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    unifiedDataService.clearCache();
    fetchDataHealth();
  };

  const handleRefreshData = () => {
    fetchDataHealth();
  };

  useEffect(() => {
    fetchDataHealth();
  }, []);

  const getConnectionStatus = () => {
    if (!isHealthy) {
      return 'error';
    }
    if (rlsFixStatus === 'failed') {
      return 'rls_error';
    }
    if (healthStatus?.cacheSize && healthStatus.cacheSize > 0) {
      return 'cached';
    }
    return 'online';
  };

  const getConnectionColor = () => {
    switch (getConnectionStatus()) {
      case 'online':
        return 'text-green-500';
      case 'cached':
        return 'text-blue-500';
      case 'rls_error':
        return 'text-orange-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectionIcon = () => {
    switch (getConnectionStatus()) {
      case 'online':
        return <Wifi className="h-4 w-4" />;
      case 'cached':
        return <Database className="h-4 w-4" />;
      case 'rls_error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (getConnectionStatus()) {
      case 'online':
        return 'Online';
      case 'cached':
        return 'Cached';
      case 'rls_error':
        return 'RLS Issue';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('admin.dataHealth.title')}</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              <span className={getConnectionColor()}>
                {getConnectionIcon()}
              </span>
              {t('admin.dataHealth.status')}: {getStatusText()}
            </Badge>
            {rlsFixStatus === 'success' && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                RLS Fixed
              </Badge>
            )}
            <Button variant="outline" size="icon" onClick={handleRefreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-polygon-blue"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">
            <AlertTriangle className="h-4 w-4 inline-block mr-1" />
            {t('common.error')}: {error}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>{t('admin.dataHealth.cacheSize')}:</span>
              <span>{healthStatus?.cacheSize || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>RLS Policy Status:</span>
              <span className={rlsFixStatus === 'success' ? 'text-green-600' : 'text-orange-600'}>
                {rlsFixStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 inline-block mr-1" />
                    Fixed
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    Needs Check
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('admin.dataHealth.healthMonitoring')}:</span>
              <span>{healthStatus?.healthMonitoring ? <CheckCircle className="h-4 w-4 text-green-500" /> : 'Off'}</span>
            </div>
            <Button onClick={handleClearCache} className="bg-polygon-blue hover:bg-polygon-darkblue">
              {t('admin.dataHealth.clearCache')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataHealthMonitor;
