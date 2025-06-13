
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentFormState } from '@/hooks/assignment/useAssignmentFormState';
import { useAssignmentDialogState } from '@/hooks/assignment/useAssignmentDialogState';
import { Assignment } from '@/types/assignment';
import { useEmployees } from '@/hooks/useEmployees';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { useCars } from '@/hooks/car';
import { usePlannerPage } from '@/hooks/usePlannerPage';
import PlannerDialogContainer from './PlannerDialogContainer';
import { format } from 'date-fns';

interface AssignmentDialogManagerProps {
  onClose: () => void;
}

const AssignmentDialogManager: React.FC<AssignmentDialogManagerProps> = ({ onClose }) => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    assignments, 
    loading, 
    error, 
    isDialogOpen: plannerDialogOpen, 
    setIsDialogOpen: setPlannerDialogOpen, 
    publishAssignment, 
    publishAssignmentsByDate 
  } = useAssignmentsConsolidated({ filter: 'planner' });
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { selectedDay } = usePlannerPage();

  // Always get a fresh date for today's date
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const {
    dialogOpen,
    setDialogOpen,
    isEditing,
    setIsEditing,
    currentAssignment,
    setCurrentAssignment,
    handleCloseDialog
  } = useAssignmentDialogState(assignmentId, assignments, onClose);

  // Use the selectedDay or a fresh today's date
  const currentDate = selectedDay || todayDate;

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
    currentDate // Pass the fresh date here
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
        navigate('/planner');
      }
    } else {
      setIsEditing(false);
      // Reset the form when creating a new assignment
      // Always use a fresh date calculation
      const freshDate = format(new Date(), 'yyyy-MM-dd');

      setFormData({
        date: selectedDay || freshDate,
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
      selectedDay={currentDate}
      onPublishDay={() => console.log('Publish day')}
    />
  );
};

export default AssignmentDialogManager;
