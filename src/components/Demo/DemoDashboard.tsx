import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useDemoTracking } from '@/hooks/useDemoTracking';
import { useDemoAutoCleanup } from '@/hooks/useDemoAutoCleanup';
import { 
  Activity, 
  Database, 
  Trash2, 
  AlertTriangle,
  Clock,
  BarChart3,
  Timer,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const DemoDashboard: React.FC = () => {
  const { isDemoMode, demoRole } = useAuth();
  const { getDemoStats } = useDemoTracking();
  const { 
    timeRemainingFormatted, 
    showWarning, 
    extendDemoSession, 
    performManualCleanup 
  } = useDemoAutoCleanup();
  const { toast } = useToast();
  const { t } = useTranslation();

  if (!isDemoMode) return null;

  const stats = getDemoStats();

  const handleManualCleanup = async () => {
    try {
      await performManualCleanup();
      toast({
        title: "Demo Data Cleaned",
        description: "All demo data has been completely removed from the database.",
      });
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Failed to clean demo data",
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

      {/* Auto-cleanup timer section */}
      <Card className={`border-2 ${showWarning ? 'border-red-500 bg-red-50' : 'border-amber-300 bg-amber-25'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Auto-Cleanup Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-mono font-bold ${showWarning ? 'text-red-600' : 'text-amber-700'}`}>
                {timeRemainingFormatted}
              </div>
              <div className={`text-sm ${showWarning ? 'text-red-600' : 'text-amber-600'}`}>
                {showWarning ? 'Warning: Cleanup imminent!' : 'Until next cleanup'}
              </div>
            </div>
            <Button
              onClick={extendDemoSession}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Extend 15 min
            </Button>
          </div>
          
          {showWarning && (
            <div className="text-xs text-red-600 font-medium">
              ⚠️ All demo data will be automatically deleted in 1 minute!
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-amber-600 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        Demo data is automatically cleaned every 15 minutes and when session ends
      </div>
    </div>
  );
};