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
    
    console.log('[VacationTabContent] COMPREHENSIVE DEBUG - Starting filter:', {
      userId: user.id,
      isEffectiveAdmin,
      isEffectiveServicemedarbejder,
      tabValue,
      totalVacations: vacations.length,
      allVacations: vacations.map(v => ({ 
        id: v.id, 
        user_id: v.user_id, 
        status: v.status,
        start_date: v.start_date,
        isOwnVacation: v.user_id === user.id
      }))
    });
    
    let filtered = [...vacations];
    
    // COMPREHENSIVE FILTERING LOGIC
    if (isEffectiveServicemedarbejder && !isEffectiveAdmin) {
      console.log('[VacationTabContent] SERVICEMEDARBEJDER ROLE - Applying comprehensive filtering');
      
      filtered = filtered.filter(v => {
        const isOwnVacation = v.user_id === user.id;
        const isApprovedFromOthers = v.status === 'approved' && v.user_id !== user.id;
        const shouldShow = isOwnVacation || isApprovedFromOthers;
        
        console.log(`[VacationTabContent] Vacation ${v.id}:`, {
          user_id: v.user_id,
          current_user_id: user.id,
          status: v.status,
          start_date: v.start_date,
          isOwnVacation,
          isApprovedFromOthers,
          FINAL_DECISION: shouldShow ? 'SHOW' : 'HIDE'
        });
        
        return shouldShow;
      });
      
      console.log(`[VacationTabContent] SERVICEMEDARBEJDER FILTERING COMPLETE:`, {
        originalCount: vacations.length,
        filteredCount: filtered.length,
        removedCount: vacations.length - filtered.length,
        finalVacations: filtered.map(v => ({ 
          id: v.id, 
          user_id: v.user_id, 
          status: v.status,
          isOwn: v.user_id === user.id
        }))
      });
    } else if (!isEffectiveAdmin) {
      // For regular users (non-admin, non-servicemedarbejder)
      console.log('[VacationTabContent] REGULAR USER - Applying standard filtering');
      
      filtered = filtered.filter(v => {
        // Show own vacations (all statuses)
        if (v.user_id === user.id) return true;
        // Show only approved vacations from others
        if (v.status === 'approved') return true;
        // Hide pending and rejected from others
        return false;
      });
    } else {
      // Admins see everything
      console.log('[VacationTabContent] ADMIN USER - Showing all vacations');
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
