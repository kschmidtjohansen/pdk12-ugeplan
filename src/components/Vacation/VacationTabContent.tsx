
import React from 'react';
import VacationList from './VacationList';
import { Vacation } from '@/types/vacation';
import { useAuth } from '@/context/AuthContext';

interface VacationTabContentProps {
  tabValue: string;
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit: (vacation: Vacation) => void;
  onDelete: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationTabContent: React.FC<VacationTabContentProps> = ({
  tabValue,
  vacations,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const { user, isAdmin } = useAuth();
  
  // Filter vacations based on the active tab
  const filteredVacations = React.useMemo(() => {
    if (!vacations) return [];
    
    switch (tabValue) {
      case 'pending':
        return vacations.filter(v => v.status === 'pending');
      case 'approved':
        return vacations.filter(v => v.status === 'approved');
      case 'mine':
        return vacations.filter(v => v.employeeId === user?.id);
      default: // 'all'
        return vacations;
    }
  }, [vacations, tabValue, user]);

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
