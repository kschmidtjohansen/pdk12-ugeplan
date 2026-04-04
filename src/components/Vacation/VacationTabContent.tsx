import VacationList from './VacationList';
import React from 'react';
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
  const { user, isEffectiveAdmin, isEffectiveServicemedarbejder } = useAuth();
  
  const filteredVacations = React.useMemo(() => {
    if (!vacations || !user) return [];
    
    let filtered = [...vacations];
    
    if (isEffectiveServicemedarbejder && !isEffectiveAdmin) {
      filtered = filtered.filter(v => v.user_id === user.id);
    } else if (!isEffectiveAdmin) {
      filtered = filtered.filter(v => {
        if (v.user_id === user.id) return true;
        if (v.status === 'approved') return true;
        return false;
      });
    }
    
    switch (tabValue) {
      case 'pending':
        filtered = filtered.filter(v => v.status === 'pending');
        break;
      case 'approved':
        filtered = filtered.filter(v => v.status === 'approved');
        break;
      case 'mine':
        filtered = filtered.filter(v => v.user_id === user.id);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });
  }, [vacations, tabValue, user, isEffectiveAdmin, isEffectiveServicemedarbejder]);

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
