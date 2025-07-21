
import React from 'react';
import VacationTable from './VacationTable';
import { Vacation } from '@/types/vacation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface VacationListProps {
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationList: React.FC<VacationListProps> = ({ 
  vacations, 
  onApprove, 
  onReject,
  onEdit,
  onDelete,
  isLoading = false 
}) => {
  const { isEffectiveAdmin } = useAuth();
  const { t } = useTranslation();
  
  return (
    <VacationTable
      vacations={vacations}
      onApprove={onApprove}
      onReject={onReject}
      onEdit={isEffectiveAdmin ? onEdit : undefined}
      isLoading={isLoading}
    />
  );
};

export default VacationList;
