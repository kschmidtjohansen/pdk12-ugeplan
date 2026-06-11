
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import VacationTabs from './VacationTabs';

interface VacationHeaderProps {
  isServicemedarbejder: boolean;
  activeTab: string;
  onChangeTab: (value: string) => void;
  onOpenRequestDialog: () => void;
  onOpenAdminDialog: () => void;
}

const VacationHeader: React.FC<VacationHeaderProps> = ({
  isServicemedarbejder,
  activeTab,
  onChangeTab,
  onOpenRequestDialog,
  onOpenAdminDialog
}) => {
  const { t } = useTranslation();
  const { isEffectiveAdmin, isEffectiveSkadeleder } = useAuth();
  const canManageVacations = isEffectiveAdmin || isEffectiveSkadeleder;
  
  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <VacationTabs 
          isServicemedarbejder={isServicemedarbejder}
          activeTab={activeTab} 
          onChange={onChangeTab}
        />
        
        <div className="flex gap-2">
          <Button
            onClick={onOpenRequestDialog}
            className="flex-1 md:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("vacation.applyForVacation")}
          </Button>
          
          {isEffectiveAdmin && (
            <Button
              onClick={onOpenAdminDialog}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("vacation.requestForEmployee")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationHeader;
