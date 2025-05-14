
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Check, X, Edit, Trash } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';

interface VacationButtonsProps {
  onCreateNew?: () => void;
  onCreateForEmployee?: () => void;
  canApproveVacation?: boolean;
  // For action buttons on existing vacations
  vacation?: Vacation;
  onApprove?: (vacation: Vacation) => void;
  onReject?: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
}

const VacationButtons: React.FC<VacationButtonsProps> = ({
  onCreateNew,
  onCreateForEmployee,
  canApproveVacation,
  vacation,
  onApprove,
  onReject,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  
  // If vacation is provided, show action buttons for that vacation
  if (vacation) {
    const isPending = vacation.status === 'pending';
    const isOwner = false; // This would need to be determined based on user context
    
    return (
      <>
        {isPending && onApprove && (
          <Button 
            onClick={() => onApprove(vacation)} 
            size="sm" 
            className="bg-green-500 hover:bg-green-600"
          >
            <Check className="h-4 w-4 mr-1" /> {t('vacation.approve')}
          </Button>
        )}
        
        {isPending && onReject && (
          <Button 
            onClick={() => onReject(vacation)} 
            size="sm" 
            variant="destructive"
          >
            <X className="h-4 w-4 mr-1" /> {t('vacation.reject')}
          </Button>
        )}
        
        {onEdit && (
          <Button 
            onClick={() => onEdit(vacation)} 
            size="sm" 
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-1" /> {t('common.edit')}
          </Button>
        )}
        
        {onDelete && (
          <Button 
            onClick={() => onDelete(vacation)} 
            size="sm" 
            variant="outline" 
            className="text-red-500 hover:text-white hover:bg-red-500"
          >
            <Trash className="h-4 w-4 mr-1" /> {t('common.delete')}
          </Button>
        )}
      </>
    );
  }
  
  // Otherwise, show create buttons
  return (
    <div className="flex space-x-2">
      {onCreateNew && (
        <Button onClick={onCreateNew} className="bg-polygon-blue">
          <Plus className="mr-2 h-4 w-4" /> {t("vacation.applyForVacation")}
        </Button>
      )}
      
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
