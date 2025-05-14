
import { useState } from 'react';
import { Vacation } from '@/types/vacation';

/**
 * Hook for managing the state of vacation request dialogs
 */
export const useVacationDialogState = () => {
  const [activeRequest, setActiveRequest] = useState<Vacation | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState<boolean>(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState<boolean>(false);
  
  return {
    activeRequest,
    setActiveRequest,
    isApprovalDialogOpen,
    setIsApprovalDialogOpen,
    isRejectionDialogOpen,
    setIsRejectionDialogOpen
  };
};
