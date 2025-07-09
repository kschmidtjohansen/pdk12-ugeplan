import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useDemoTracking } from '@/hooks/useDemoTracking';
import { 
  Activity, 
  Database, 
  Trash2, 
  AlertTriangle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const DemoDashboard: React.FC = () => {
  const { isDemoMode, demoRole } = useAuth();
  const { getDemoStats, triggerManualCleanup } = useDemoTracking();
  const { toast } = useToast();
  const { t } = useTranslation();

  if (!isDemoMode) return null;

  const stats = getDemoStats();

  const handleManualCleanup = async () => {
    try {
      await triggerManualCleanup();
      toast({
        title: t('common.demoDataCleaned'),
        description: t('common.demoDataCleanedDescription'),
      });
    } catch (error) {
      toast({
        title: t('common.cleanupFailed'),
        description: error instanceof Error ? error.message : t('common.failedToCleanupDemo'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-amber-800">{t('common.demoDashboard')}</h2>
          <p className="text-sm text-amber-600">
            {t('common.currentlyInDemoMode')} <span className="font-medium">{demoRole}</span>
          </p>
        </div>
        <Button
          onClick={handleManualCleanup}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {t('common.cleanDemoData')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('common.totalOperations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOperations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('common.createdRecords')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.createdRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('common.updatedRecords')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.updatedRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('common.tablesAffected')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.tablesAffected.length}</div>
          </CardContent>
        </Card>
      </div>

      {stats.tablesAffected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('common.affectedTables')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.tablesAffected.map(table => (
                <Badge key={table} variant="secondary">
                  {table}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-amber-600 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        {t('common.demoDataAutoClean')}
      </div>
    </div>
  );
};