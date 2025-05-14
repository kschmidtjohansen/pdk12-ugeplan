
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentFormState } from '@/hooks/assignment/useAssignmentFormState';
import { useAssignmentDialogState } from '@/hooks/assignment/useAssignmentDialogState';
import { Assignment } from '@/types/assignment';
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
  const { assignments, groupedAssignments, loading, error, isDialogOpen: plannerDialogOpen, setIsDialogOpen: setPlannerDialogOpen, publishAssignment, publishAssignmentsByDate } = usePlannerAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { selectedDay } = usePlannerPage();

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
    handleSubmit: originalHandleSubmit
  } = useAssignmentFormState(
    employees,
    cars,
    assignments,
    () => {}, // We'll use the onSubmit prop from PlannerDialogContainer instead
    currentAssignment,
    setCurrentAssignment,
    setDialogOpen,
    selectedDay || new Date().toISOString().split('T')[0]
  );

  // Create a wrapper for handleSubmit to match the expected type
  const handleSubmit = (data: Partial<Assignment>) => {
    originalHandleSubmit({
      preventDefault: () => {},
    } as React.FormEvent);
  };

  useEffect(() => {
    if (assignmentId) {
      setIsEditing(true);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (assignment) {
        setCurrentAssignment(assignment);
        // Initialize form data with assignment details
        setFormData({
          date: assignment.date,
          title: assignment.title,
          description: assignment.description || '',
          fromTime: assignment.fromTime,
          toTime: assignment.toTime,
          location: assignment.location || '',
          car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
          employees: assignment.employees || []
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
        date: selectedDay || new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        fromTime: '08:00',
        toTime: '16:00',
        location: '',
        car: '',
        employees: []
      });
    }
  }, [assignmentId, assignments, navigate, setCurrentAssignment, setFormData, selectedDay, setIsEditing]);

  return (
    <PlannerDialogContainer
      isDialogOpen={dialogOpen}
      setIsDialogOpen={setDialogOpen}
      currentAssignment={currentAssignment}
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      onDelete={(id) => console.log('Delete assignment with id:', id)}
      onPublish={(id) => console.log('Publish assignment with id:', id)}
      assignments={assignments}
      selectedDay={selectedDay || new Date().toISOString().split('T')[0]}
      onPublishDay={() => console.log('Publish day')}
    />
  );
};

export default AssignmentDialogManager;
