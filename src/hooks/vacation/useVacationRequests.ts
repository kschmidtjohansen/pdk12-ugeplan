
import { useCallback } from 'react';
import { useVacationRequestSubmission } from './requests/useVacationRequestSubmission';
import { useVacationDialogState } from './requests/useVacationDialogState';
import { useVacationApprovals } from './requests/useVacationApprovals';

/**
 * Main hook for vacation request management
 * This is a facade that combines more specific vacation request hooks
 */
export const useVacationRequests = () => {
  const { vacations, isSubmitting, fetchVacations } = useVacationRequestSubmission();
  
  const {
    activeRequest,
    setActiveRequest,
    isApprovalDialogOpen,
    setIsApprovalDialogOpen,
    isRejectionDialogOpen,
    setIsRejectionDialogOpen
  } = useVacationDialogState();
  
  const { 
    approveVacation, 
    rejectVacation, 
    handleApproveVacation,
    handleRejectVacation
  } = useVacationApprovals(activeRequest, fetchVacations);
  
  // Dialog management functions
  const openApprovalDialog = useCallback((vacation) => {
    setActiveRequest(vacation);
    setIsApprovalDialogOpen(true);
  }, [setActiveRequest, setIsApprovalDialogOpen]);
  
  const openRejectionDialog = useCallback((vacation) => {
    setActiveRequest(vacation);
    setIsRejectionDialogOpen(true);
  }, [setActiveRequest, setIsRejectionDialogOpen]);

  return {
    vacations,
    isSubmitting,
    activeRequest,
    isApprovalDialogOpen,
    isRejectionDialogOpen,
    submitVacationRequest: useVacationRequestSubmission().submitVacationRequest,
    openApprovalDialog,
    openRejectionDialog,
    handleApproveVacation,
    handleRejectVacation,
    setIsApprovalDialogOpen,
    setIsRejectionDialogOpen
  };
};
