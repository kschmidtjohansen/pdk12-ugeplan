
import { useCallback } from 'react';
import { Vacation } from '@/types/vacation';
import { useVacationApprovalActions } from '../useVacationApprovalActions';

/**
 * Hook for handling vacation approval and rejection actions
 */
export const useVacationApprovals = (
  activeRequest: Vacation | null, 
  fetchVacations: () => Promise<void>
) => {
  const { approveVacation, rejectVacation } = useVacationApprovalActions(fetchVacations);
  
  // Handle vacation approval
  const handleApproveVacation = useCallback(async (noteText: string) => {
    if (!activeRequest) return;
    
    const success = await approveVacation(activeRequest, noteText);
    return success;
  }, [activeRequest, approveVacation]);
  
  // Handle vacation rejection
  const handleRejectVacation = useCallback(async (noteText: string) => {
    if (!activeRequest) return;
    
    const success = await rejectVacation(activeRequest, noteText);
    return success;
  }, [activeRequest, rejectVacation]);
  
  return {
    approveVacation,
    rejectVacation,
    handleApproveVacation,
    handleRejectVacation
  };
};
