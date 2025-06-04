
import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import AssignmentForm from './AssignmentForm';
import { Assignment } from '@/types/assignment';
import { format } from 'date-fns';
import { getCarIds } from '@/utils/carUtils';

interface PlannerDialogContainerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Assignment>>>;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (id: string) => void;
  onPublish?: (id: string) => void;
  assignments: Assignment[];
  selectedDay: string;
  onPublishDay?: () => void;
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
  const { vacations } = useVacations();
  const { employees } = useEmployees();
  const { cars } = useCars();
  
  // Always get a fresh today's date for the current render
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  
  // Update selectedDay to use today's fresh date if it's not provided
  const currentDate = (selectedDay && selectedDay.trim() !== '') ? selectedDay : todayDate;
  
  // Track selected employees separately for better UI state management
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // FIXED: Ensure we update formData.date with current date when dialog opens AND properly handle car/responsible user conversion
  useEffect(() => {
    if (isDialogOpen) {
      console.log('[PlannerDialogContainer] Dialog opened, current assignment:', currentAssignment);
      
      if (!currentAssignment) {
        // Creating new assignment
        console.log('[PlannerDialogContainer] Creating new assignment, updating form date:', currentDate);
        setFormData(prev => ({
          ...prev,
          date: currentDate
        }));
      } else {
        // FIXED: Editing existing assignment - properly convert car and responsible user objects to IDs
        console.log('[PlannerDialogContainer] Editing existing assignment');
        
        const carIds = getCarIds(currentAssignment.car);
        const responsibleUserId = currentAssignment.responsibleUser?.id || '';
        
        console.log('[PlannerDialogContainer] Setting form data with car IDs:', carIds);
        setFormData({
          id: currentAssignment.id,
          date: currentAssignment.date,
          title: currentAssignment.title,
          description: currentAssignment.description || '',
          fromTime: currentAssignment.fromTime,
          toTime: currentAssignment.toTime,
          location: currentAssignment.location,
          car: carIds,
          employees: currentAssignment.employees || [],
          published: currentAssignment.published
        });
      }
    }
  }, [isDialogOpen, currentAssignment, currentDate, setFormData]);
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AssignmentForm
        employees={employees}
        cars={cars}
        vacations={vacations}
        assignments={assignments}
        currentAssignment={currentAssignment}
        formData={formData}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onPublish={onPublish}
        selectedDate={currentDate}
        onPublishDay={onPublishDay}
        selectedEmployees={selectedEmployees}
        setSelectedEmployees={setSelectedEmployees}
      />
    </Dialog>
  );
};

export default PlannerDialogContainer;
