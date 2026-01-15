
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AssignmentForm from './AssignmentForm';

type SetFormDataFn = (data: Partial<Assignment> | ((prev: Partial<Assignment>) => Partial<Assignment>)) => void;

interface AssignmentDialogManagerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: SetFormDataFn;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onPublishDay: (date: string) => void;
  onEmployeeToggle: (employeeId: string) => void;
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
  onEmployeeToggle
}) => {
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
          onEmployeeToggle={onEmployeeToggle}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialogManager;
