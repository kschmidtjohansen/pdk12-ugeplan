
import React from 'react';
import { Vacation } from '@/types/vacation';
import { VacationStatus } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import VacationList from './VacationList';

interface VacationTabContentProps {
  vacations: Vacation[];
  tabValue: string;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationTabContent: React.FC<VacationTabContentProps> = ({
  vacations,
  tabValue,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Filter vacations based on tab
  const filteredVacations = React.useMemo(() => {
    switch (tabValue) {
      case 'pending':
        return vacations.filter((v) => v.status === 'pending');
      case 'approved':
        return vacations.filter((v) => v.status === 'approved');
      case 'mine':
        return vacations.filter((v) => v.employeeId === user?.id);
      case 'all':
      default:
        return vacations;
    }
  }, [vacations, tabValue, user?.id]);
  
  return (
    <div className="mt-6">
      <VacationList 
        vacations={filteredVacations}
        onApprove={onApprove}
        onReject={onReject}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default VacationTabContent;
