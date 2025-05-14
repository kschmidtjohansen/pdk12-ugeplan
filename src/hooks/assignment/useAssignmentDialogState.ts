
import { useState, useCallback } from 'react';
import { Assignment } from '@/types/assignment';

export const useAssignmentDialogState = (
  assignmentId: string | undefined,
  assignments: Assignment[],
  onClose?: () => void
) => {
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(!!assignmentId);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

  // Handle closing the dialog
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  return {
    dialogOpen,
    setDialogOpen,
    isEditing,
    setIsEditing,
    currentAssignment,
    setCurrentAssignment,
    handleCloseDialog
  };
};
