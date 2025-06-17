
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Database, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { cleanupFalsePositiveSecurityLogs, cleanupOldSecurityLogs, optimizeSecurityLogsTable } from '@/utils/databaseCleanup';
import { useToast } from '@/components/ui/use-toast';

export const SystemCleanupPanel: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: any }>({});

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const handleCleanupFalsePositives = async () => {
    setLoading(prev => ({ ...prev, falsePositives: true }));
    
    try {
      const result = await cleanupFalsePositiveSecurityLogs();
      setResults(prev => ({ ...prev, falsePositives: result }));
      
      if (result.success) {
        toast({
          title: t('admin.cleanup.falsePositives.success'),
          description: t('admin.cleanup.falsePositives.successMessage', { count: result.deletedCount }),
        });
      } else {
        toast({
          title: t('admin.cleanup.falsePositives.failed'),
          description: result.error || t('admin.cleanup.falsePositives.error'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('admin.cleanup.falsePositives.failed'),
        description: t('admin.cleanup.falsePositives.error'),
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, falsePositives: false }));
    }
  };

  const handleCleanupOldLogs = async () => {
    setLoading(prev => ({ ...prev, oldLogs: true }));
    
    try {
      const result = await cleanupOldSecurityLogs(30);
      setResults(prev => ({ ...prev, oldLogs: result }));
      
      if (result.success) {
        toast({
          title: t('admin.cleanup.oldLogs.success'),
          description: t('admin.cleanup.oldLogs.successMessage', { count: result.deletedCount }),
        });
      } else {
        toast({
          title: t('admin.cleanup.oldLogs.failed'),
          description: result.error || t('admin.cleanup.oldLogs.error'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('admin.cleanup.oldLogs.failed'),
        description: t('admin.cleanup.oldLogs.error'),
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, oldLogs: false }));
    }
  };

  const handleOptimizeTable = async () => {
    setLoading(prev => ({ ...prev, optimize: true }));
    
    try {
      const result = await optimizeSecurityLogsTable();
      setResults(prev => ({ ...prev, optimize: result }));
      
      if (result.success) {
        toast({
          title: t('admin.cleanup.optimization.success'),
          description: t('admin.cleanup.optimization.successMessage'),
        });
      } else {
        toast({
          title: t('admin.cleanup.optimization.failed'),
          description: result.error || t('admin.cleanup.optimization.error'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('admin.cleanup.optimization.failed'),
        description: t('admin.cleanup.optimization.error'),
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, optimize: false }));
    }
  };

  const getResultIcon = (result: any) => {
    if (!result) return null;
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getResultBadge = (result: any) => {
    if (!result) return null;
    return (
      <Badge variant={result.success ? "default" : "destructive"}>
        {result.success ? t('admin.common.success') : t('admin.common.error')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('admin.cleanup.title')}</h2>
        <p className="text-muted-foreground">
          {t('admin.cleanup.description')}
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{t('admin.cleanup.important.title')}</strong> {t('admin.cleanup.important.description')}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* False Positives Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('admin.cleanup.falsePositives.title')}</span>
              {getResultIcon(results.falsePositives)}
            </CardTitle>
            <CardDescription>
              {t('admin.cleanup.falsePositives.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCleanupFalsePositives}
              disabled={loading.falsePositives}
              className="w-full"
              variant="outline"
            >
              <Trash2 className={`h-4 w-4 mr-2 ${loading.falsePositives ? 'animate-spin' : ''}`} />
              {t('admin.cleanup.falsePositives.button')}
            </Button>
            
            {results.falsePositives && (
              <div className="space-y-2">
                {getResultBadge(results.falsePositives)}
                <p className="text-sm text-muted-foreground">
                  {results.falsePositives.success 
                    ? t('admin.cleanup.falsePositives.successMessage', { count: results.falsePositives.deletedCount })
                    : `${t('admin.common.error')}: ${results.falsePositives.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Old Logs Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('admin.cleanup.oldLogs.title')}</span>
              {getResultIcon(results.oldLogs)}
            </CardTitle>
            <CardDescription>
              {t('admin.cleanup.oldLogs.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCleanupOldLogs}
              disabled={loading.oldLogs}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading.oldLogs ? 'animate-spin' : ''}`} />
              {t('admin.cleanup.oldLogs.button')}
            </Button>
            
            {results.oldLogs && (
              <div className="space-y-2">
                {getResultBadge(results.oldLogs)}
                <p className="text-sm text-muted-foreground">
                  {results.oldLogs.success 
                    ? t('admin.cleanup.oldLogs.successMessage', { count: results.oldLogs.deletedCount })
                    : `${t('admin.common.error')}: ${results.oldLogs.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('admin.cleanup.optimization.title')}</span>
              {getResultIcon(results.optimize)}
            </CardTitle>
            <CardDescription>
              {t('admin.cleanup.optimization.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleOptimizeTable}
              disabled={loading.optimize}
              className="w-full"
              variant="outline"
            >
              <Database className={`h-4 w-4 mr-2 ${loading.optimize ? 'animate-spin' : ''}`} />
              {t('admin.cleanup.optimization.button')}
            </Button>
            
            {results.optimize && (
              <div className="space-y-2">
                {getResultBadge(results.optimize)}
                <p className="text-sm text-muted-foreground">
                  {results.optimize.success 
                    ? t('admin.cleanup.optimization.successMessage')
                    : `${t('admin.common.error')}: ${results.optimize.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.cleanup.summary.title')}</CardTitle>
          <CardDescription>
            {t('admin.cleanup.summary.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t('admin.cleanup.summary.falsePositivesCleaned')}</span>
              <span className="font-medium">
                {results.falsePositives?.success ? results.falsePositives.deletedCount : t('admin.cleanup.summary.notAvailable')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('admin.cleanup.summary.oldLogsCleaned')}</span>
              <span className="font-medium">
                {results.oldLogs?.success ? results.oldLogs.deletedCount : t('admin.cleanup.summary.notAvailable')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('admin.cleanup.summary.tableOptimization')}</span>
              <span className="font-medium">
                {results.optimize?.success ? t('admin.cleanup.summary.requested') : t('admin.cleanup.summary.notAvailable')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
