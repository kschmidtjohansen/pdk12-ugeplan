
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
  const { user, isAdmin, isSkadeleder } = useAuth();
  
  // Filter vacations based on the active tab and user roles
  const filteredVacations = React.useMemo(() => {
    if (!vacations || !user) return [];
    
    let filtered = [...vacations];
    
    // First, filter out rejected applications that aren't the user's own
    filtered = filtered.filter(v => {
      if (v.status === 'rejected') {
        // Rejected vacations are only visible to the applicant
        return v.user_id === user.id;
      }
      return true;
    });
    
    // Then, filter pending applications based on roles
    filtered = filtered.filter(v => {
      if (v.status === 'pending') {
        // Pending applications are only visible to admins and the applicant
        if (isAdmin) return true;
        return v.user_id === user.id;
      }
      return true;
    });
    
    // Now apply tab filtering
    switch (tabValue) {
      case 'pending':
        return filtered.filter(v => v.status === 'pending');
      case 'approved':
        return filtered.filter(v => v.status === 'approved');
      case 'mine':
        return filtered.filter(v => v.user_id === user.id);
      default: // 'all'
        filtered = filtered;
    }

    // Sort vacations to always show pending applications first
    return filtered.sort((a, b) => {
      // If one is pending and the other is not, pending comes first
      if (a.status === 'pending' && b.status !== 'pending') {
        return -1;
      }
      if (a.status !== 'pending' && b.status === 'pending') {
        return 1;
      }
      
      // If both have the same status, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [vacations, tabValue, user, isAdmin, isSkadeleder]);

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
