
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface VacationButtonsProps {
  onCreateNew: () => void;
  onCreateForEmployee?: () => void;
  canApproveVacation: boolean;
}

const VacationButtons: React.FC<VacationButtonsProps> = ({
  onCreateNew,
  onCreateForEmployee,
  canApproveVacation
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex space-x-2">
      <Button onClick={onCreateNew} className="bg-polygon-blue">
        <Plus className="mr-2 h-4 w-4" /> {t("vacation.applyForVacation")}
      </Button>
      
      {/* Admin button for requesting vacation for others */}
      {canApproveVacation && onCreateForEmployee && (
        <Button onClick={onCreateForEmployee} variant="outline" className="border-polygon-blue text-polygon-blue">
          <UserPlus className="mr-2 h-4 w-4" /> {t("vacation.requestForEmployee")}
        </Button>
      )}
    </div>
  );
};

export default VacationButtons;
