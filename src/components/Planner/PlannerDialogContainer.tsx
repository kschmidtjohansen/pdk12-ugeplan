
import React from 'react';
import { Assignment } from '@/types/assignment';
import AssignmentDialogManager from './AssignmentDialogManager';

interface PlannerDialogContainerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Assignment>>>;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  selectedDay: string;
  onPublishDay: () => void;
}

const PlannerDialogContainer: React.FC<PlannerDialogContainerProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onPublish,
  assignments,
  selectedDay,
  onPublishDay
}) => {
  // Only render the dialog when it's actually open
  if (!isDialogOpen) {
    return null;
  }

  return (
    <AssignmentDialogManager
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      editMode={!!currentAssignment}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onPublish={onPublish}
      assignments={assignments}
      selectedDay={selectedDay}
      onPublishDay={onPublishDay}
    />
  );
};

export default PlannerDialogContainer;
