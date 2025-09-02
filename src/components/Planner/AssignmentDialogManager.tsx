
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AssignmentForm from './AssignmentForm';
import AssignmentViewDialog from './AssignmentViewDialog';
import { useAuth } from '@/context/AuthContext';

interface AssignmentDialogManagerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: (data: Partial<Assignment>) => void;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onPublishDay: (date: string) => void;
  viewMode?: boolean; // New prop to control view vs edit mode
  onFileUpload?: (files: File[]) => Promise<void>;
}

const AssignmentDialogManager: React.FC<AssignmentDialogManagerProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onPublish,
  assignments,
  cars,
  employees,
  vacations,
  selectedDay,
  onPublishDay,
  viewMode = false,
  onFileUpload
}) => {
  const { canEditAssignments } = useAuth();
  
  const handleEditFromView = (assignment: Assignment) => {
    // Switch to edit mode by updating form data
    setFormData({
      ...assignment,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
      published: assignment.published
    });
    // The parent component should handle switching to edit mode
  };

  // If in view mode, show the view dialog
  if (viewMode && currentAssignment) {
    return (
      <AssignmentViewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        assignment={currentAssignment}
        cars={cars}
        employees={employees}
        vacations={vacations}
        onEdit={canEditAssignments ? handleEditFromView : undefined}
        onFileUpload={onFileUpload}
      />
    );
  }

  // Otherwise show the edit dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AssignmentForm
          currentAssignment={currentAssignment}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onPublish={onPublish}
          assignments={assignments}
          cars={cars}
          employees={employees}
          vacations={vacations}
          selectedDay={selectedDay}
          onPublishDay={onPublishDay}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialogManager;
