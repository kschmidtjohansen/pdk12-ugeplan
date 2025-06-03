
import React from 'react';
import VacationTable from './VacationTable';
import { Vacation } from '@/types/vacation';

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
  return (
    <VacationTable
      vacations={vacations}
      onApprove={onApprove}
      onReject={onReject}
      onEdit={onEdit}
      isLoading={isLoading}
    />
  );
};

export default VacationList;
