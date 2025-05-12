
import React from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import VacationTabs from './VacationTabs';

interface VacationHeaderProps {
  isServicemedarbejder: boolean;
  activeTab: string;
  onChangeTab: (tab: string) => void;
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
  const { isAdmin, isSkadeleder } = usePermissions();
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <VacationTabs
        isServicemedarbejder={isServicemedarbejder}
        activeTab={activeTab}
        onChange={onChangeTab}
      />
      
      <div className="flex gap-2">
        <Button 
          onClick={onOpenRequestDialog}
          className="bg-polygon-blue hover:bg-polygon-darkblue"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("vacation.applyForVacation")}
        </Button>
        
        {(isAdmin || isSkadeleder) && (
          <Button 
            onClick={onOpenAdminDialog} 
            variant="outline"
            className="bg-white"
          >
            {t("vacation.requestForEmployee")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VacationHeader;
