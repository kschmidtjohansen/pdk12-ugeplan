
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import AssignmentDialogManager from './AssignmentDialogManager';

interface PlannerDialogContainerProps {
  isDialogOpen: boolean;
  onClose: () => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: (data: Partial<Assignment>) => void;
  onSubmit: (data: Partial<Assignment>) => Promise<void>;
  assignments: Assignment[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onEmployeeToggle: (employeeId: string) => void;
}

const PlannerDialogContainer: React.FC<PlannerDialogContainerProps> = ({
  isDialogOpen,
  onClose,
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  assignments,
  cars,
  employees,
  vacations,
  selectedDay,
  onEmployeeToggle
}) => {
  return (
    <AssignmentDialogManager
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={onClose}
      currentAssignment={currentAssignment}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onDelete={() => {}} // Not used in this context
      onPublish={() => {}} // Not used in this context
      assignments={assignments}
      cars={cars}
      employees={employees}
      vacations={vacations}
      selectedDay={selectedDay}
      onPublishDay={() => {}} // Not used in this context
      onEmployeeToggle={onEmployeeToggle}
    />
  );
};

export default PlannerDialogContainer;
