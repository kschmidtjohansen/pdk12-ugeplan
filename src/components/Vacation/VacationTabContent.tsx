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
  const { user, isEffectiveAdmin, isEffectiveServicemedarbejder } = useAuth();
  
  // Filter vacations based on the active tab and user roles
  const filteredVacations = React.useMemo(() => {
    if (!vacations || !user) return [];
    
    console.log('[VacationTabContent] Debug info:', {
      userId: user.id,
      isEffectiveAdmin,
      isEffectiveServicemedarbejder,
      tabValue,
      totalVacations: vacations.length,
      vacationUserIds: vacations.map(v => ({ id: v.id, user_id: v.user_id, status: v.status }))
    });
    
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
        if (isEffectiveAdmin) return true;
        return v.user_id === user.id;
      }
      return true;
    });

    // For servicemedarbejder role, only show own vacations + approved vacations from others
    if (isEffectiveServicemedarbejder && !isEffectiveAdmin) {
      console.log('[VacationTabContent] Applying servicemedarbejder filtering');
      filtered = filtered.filter(v => {
        const isOwnVacation = v.user_id === user.id;
        const isApprovedFromOthers = v.status === 'approved' && v.user_id !== user.id;
        
        console.log(`[VacationTabContent] Vacation ${v.id}: user_id=${v.user_id}, status=${v.status}, isOwn=${isOwnVacation}, isApprovedFromOthers=${isApprovedFromOthers}`);
        
        // Always show user's own vacations
        if (isOwnVacation) return true;
        // Show approved vacations from others for scheduling awareness
        if (isApprovedFromOthers) return true;
        // Hide rejected and pending from others
        return false;
      });
      console.log(`[VacationTabContent] After servicemedarbejder filtering: ${filtered.length} vacations`);
    }
    
    // Now apply tab filtering
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
      default: // 'all'
        // Keep all filtered vacations
        break;
    }

    // Sort vacations to prioritize by upcoming dates and status
    return filtered.sort((a, b) => {
      // If one is pending and the other is not, pending comes first
      if (a.status === 'pending' && b.status !== 'pending') {
        return -1;
      }
      if (a.status !== 'pending' && b.status === 'pending') {
        return 1;
      }
      
      // Within the same status, sort by start_date ascending (next date first)
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });
  }, [vacations, tabValue, user, isEffectiveAdmin, isEffectiveServicemedarbejder]);

  // Log final filtered results
  React.useEffect(() => {
    if (isEffectiveServicemedarbejder && !isEffectiveAdmin) {
      console.log('[VacationTabContent] Final filtered vacations for servicemedarbejder:', {
        count: filteredVacations.length,
        vacations: filteredVacations.map(v => ({ 
          id: v.id, 
          user_id: v.user_id, 
          status: v.status, 
          isOwn: v.user_id === user?.id 
        }))
      });
    }
  }, [filteredVacations, isEffectiveServicemedarbejder, isEffectiveAdmin, user?.id]);

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
