
import React from 'react';
import { Assignment } from '@/types/assignment';
import AssignmentForm from './AssignmentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/context/TranslationContext';

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
  const { t } = useTranslation();
  
  // Add debugging to track the form data as it passes through
  console.log("PlannerDialogContainer - Current Assignment:", currentAssignment);
  console.log("PlannerDialogContainer - Form Data:", formData);

  // Only render the dialog when it's actually open
  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {currentAssignment ? t('planner.editAssignment') : t('planner.newAssignment')}
          </DialogTitle>
        </DialogHeader>
        <AssignmentForm
          assignment={currentAssignment}
          onSubmit={onSubmit}
          onCancel={() => setIsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PlannerDialogContainer;
