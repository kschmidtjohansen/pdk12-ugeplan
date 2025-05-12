
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
  const { user, isAdmin, isSkadeleder } = useAuth();
  
  // Filter vacations based on tab
  const filteredVacations = React.useMemo(() => {
    // For admin/skadeleders, filter out rejected applications except in "all" tab
    let filtered = vacations;
    
    // If user is admin or skadeleder and not in "all" tab, filter out rejected ones
    if ((isAdmin || isSkadeleder) && tabValue !== 'all') {
      filtered = vacations.filter(v => v.status !== 'rejected');
    }
    
    // Now apply tab-specific filters
    switch (tabValue) {
      case 'pending':
        return filtered.filter((v) => v.status === 'pending');
      case 'approved':
        return filtered.filter((v) => v.status === 'approved');
      case 'mine':
        return vacations.filter((v) => v.employeeId === user?.id); // Show all mine regardless of status
      case 'all':
      default:
        return filtered;
    }
  }, [vacations, tabValue, user?.id, isAdmin, isSkadeleder]);
  
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
