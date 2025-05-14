
import React from 'react';
import { Button } from '@/components/ui/button';
import { Vacation } from '@/types/vacation';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface VacationActionButtonsProps {
  vacation: Vacation;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit: (vacation: Vacation) => void;
  onDelete: (vacation: Vacation) => void;
}

const VacationActionButtons: React.FC<VacationActionButtonsProps> = ({
  vacation,
  onApprove,
  onReject,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const canModify = isAdmin || isSkadeleder;

  // Only show approve/reject buttons for pending requests
  const showApproveReject = vacation.status === 'pending' && canModify;
  
  // Only show edit/delete buttons for admins or for the user's own requests
  const showEditDelete = canModify;

  return (
    <div className="flex flex-wrap gap-2">
      {showApproveReject && (
        <>
          <Button
            onClick={() => onApprove(vacation)}
            variant="default"
            size="sm"
            className="flex-1"
          >
            {t('vacation.approve')}
          </Button>
          <Button
            onClick={() => onReject(vacation)}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            {t('vacation.reject')}
          </Button>
        </>
      )}
      
      {showEditDelete && (
        <>
          <Button
            onClick={() => onEdit(vacation)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {t('common.edit')}
          </Button>
          <Button
            onClick={() => onDelete(vacation)}
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive/10 flex-1"
          >
            {t('common.delete')}
          </Button>
        </>
      )}
    </div>
  );
};

export default VacationActionButtons;
