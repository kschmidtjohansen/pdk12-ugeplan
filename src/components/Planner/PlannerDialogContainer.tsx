
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
  onSubmitSeries?: (groupId: string, data: Partial<Assignment>) => Promise<void>;
  onDetachFromGroup?: (id: string) => Promise<boolean>;
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
  onSubmitSeries,
  onDetachFromGroup,
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
      onSubmitSeries={onSubmitSeries}
      onDetachFromGroup={onDetachFromGroup}
      onDelete={() => {}}
      onPublish={() => {}}
      assignments={assignments}
      cars={cars}
      employees={employees}
      vacations={vacations}
      selectedDay={selectedDay}
      onPublishDay={() => {}}
      onEmployeeToggle={onEmployeeToggle}
    />
  );
};

export default PlannerDialogContainer;
