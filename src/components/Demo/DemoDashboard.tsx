import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useDemoTracking } from '@/hooks/useDemoTracking';
import { useDemoAutoCleanup } from '@/hooks/useDemoAutoCleanup';
import { 
  Activity, 
  Trash2, 
  AlertTriangle,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';

export const DemoDashboard: React.FC = () => {
  const { isDemoMode, demoRole } = useAuth();
  const { triggerManualCleanup } = useDemoTracking();
  const { 
    timeRemainingFormatted, 
    showWarning, 
    extendDemoSession, 
    performManualCleanup 
  } = useDemoAutoCleanup();
  const { toast } = useToast();
  const { t } = useTranslation();

  if (!isDemoMode) return null;

  // Stats removed — demo tracking now uses DB-only approach

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
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Activity className="h-4 w-4" />
            <span className="font-medium">{t('common.demoMode')}</span>
          </div>
          <DemoRoleSwitcher />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {timeRemainingFormatted}
          </div>
          <Button
            onClick={handleManualCleanup}
            variant="destructive"
            size="sm"
            className="flex items-center gap-1 h-7 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3" />
            {t('common.cleanDemoData')}
          </Button>
        </div>
      </div>
      
      {showWarning && (
        <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          ⚠️ {t('common.allDemoDataWillBeDeleted')}
        </div>
      )}
    </div>
  );
};