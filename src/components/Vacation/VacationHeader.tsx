import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import VacationTabs from './VacationTabs';

interface VacationHeaderProps {
  counts?: Record<string, number>;
  isServicemedarbejder: boolean;
  activeTab: string;
  onChangeTab: (value: string) => void;
  onOpenRequestDialog: () => void;
  onOpenAdminDialog: () => void;
}

const VacationHeader: React.FC<VacationHeaderProps> = ({
  counts,
  isServicemedarbejder,
  activeTab,
  onChangeTab,
  onOpenRequestDialog,
  onOpenAdminDialog
}) => {
  const { t } = useTranslation();
  const { isEffectiveAdmin, isEffectiveSkadeleder, effectiveRole } = useAuth();
  const { canViewAllVacations: canManageVacations } = useAuth();
  const canViewCalendar = isEffectiveAdmin || isEffectiveSkadeleder || effectiveRole === 'super_admin';
  const isCalendarTab = activeTab === 'calendar';

  return (
    <div className="border-b border-border pb-4">
      <div className="flex flex-col gap-4">
        <VacationTabs 
          counts={counts}
          isServicemedarbejder={isServicemedarbejder}
          activeTab={activeTab} 
          onChange={onChangeTab}
          canViewCalendar={canViewCalendar}
        />
        
        {!isCalendarTab && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onOpenRequestDialog}
              className="min-h-11 flex-1 whitespace-normal sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("vacation.applyForVacation")}
            </Button>
            
            {canManageVacations && (
              <Button
                onClick={onOpenAdminDialog}
                variant="outline"
                className="min-h-11 flex-1 whitespace-normal sm:flex-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("vacation.requestForEmployee")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VacationHeader;
