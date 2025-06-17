
import React from 'react';
import { Assignment } from '@/types/assignment';
import AssignmentDialogManager from './AssignmentDialogManager';

interface PlannerDialogContainerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: (data: Partial<Assignment>) => void;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  selectedDay: string;
  onPublishDay: (date: string) => void; // FIXED: Updated to accept date parameter
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
  return (
    <AssignmentDialogManager
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      currentAssignment={currentAssignment}
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
