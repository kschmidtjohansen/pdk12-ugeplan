import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentFormState } from '@/hooks/assignment/useAssignmentFormState';
import { useAssignmentDialogState } from '@/hooks/assignment/useAssignmentDialogState';
import { Assignment, AssignmentFormData } from '@/types/assignment';
import { useEmployees } from '@/hooks/useEmployees';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useCars } from '@/hooks/car';
import { usePlannerPage } from '@/hooks/usePlannerPage';
import PlannerDialogContainer from './PlannerDialogContainer';

interface AssignmentDialogManagerProps {
  onClose: () => void;
}

const AssignmentDialogManager: React.FC<AssignmentDialogManagerProps> = ({ onClose }) => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { assignments, fetchAssignments } = usePlannerAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { selectedDate } = usePlannerPage();

  const {
    dialogOpen,
    setDialogOpen,
    isEditing,
    setIsEditing,
    currentAssignment,
    setCurrentAssignment,
    handleCloseDialog
  } = useAssignmentDialogState(assignmentId, assignments, onClose);

  const {
    formData,
    setFormData,
    handleInputChange,
    handleEmployeeChange,
    handleCarChange,
    handleSubmit
  } = useAssignmentFormState(
    employees,
    cars.cars,
    assignments,
    fetchAssignments,
    currentAssignment,
    setCurrentAssignment,
    setDialogOpen,
    selectedDate
  );

  useEffect(() => {
    if (assignmentId) {
      setIsEditing(true);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (assignment) {
        setCurrentAssignment(assignment);
        // Initialize form data with assignment details
        setFormData({
          date: assignment.date,
          employee: assignment.employee ? (typeof assignment.employee === 'string' ? assignment.employee : assignment.employee.id) : '',
          car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
          description: assignment.description || '',
        });
      } else {
        console.error(`Assignment with id ${assignmentId} not found`);
        // Optionally redirect or show an error message
        navigate('/planner');
      }
    } else {
      setIsEditing(false);
      // Reset the form when creating a new assignment
      setFormData({
        date: selectedDate,
        employee: '',
        car: '',
        description: '',
      });
    }
  }, [assignmentId, assignments, navigate, setCurrentAssignment, setFormData, selectedDate, setIsEditing]);

  return (
    <PlannerDialogContainer
      open={dialogOpen}
      isEditing={isEditing}
      formData={formData}
      employees={employees}
      cars={cars.cars}
      onClose={handleCloseDialog}
      onInputChange={handleInputChange}
      onEmployeeChange={handleEmployeeChange}
      onCarChange={handleCarChange}
      onSubmit={handleSubmit}
    />
  );
};

export default AssignmentDialogManager;
