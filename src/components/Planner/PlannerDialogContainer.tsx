
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
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
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onPublishDay: (date: string) => void;
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
  cars,
  employees,
  vacations,
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
      cars={cars}
      employees={employees}
      vacations={vacations}
      selectedDay={selectedDay}
      onPublishDay={onPublishDay}
    />
  );
};

export default PlannerDialogContainer;
