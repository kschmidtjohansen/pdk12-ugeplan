
import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import AssignmentForm from './AssignmentForm';
import { Assignment } from '@/types/assignment';
import { format } from 'date-fns';

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
  
  // Update form data when dialog opens and properly handle car/responsible user conversion
  useEffect(() => {
    if (isDialogOpen) {
      console.log('[PlannerDialogContainer] Dialog opened, current assignment:', currentAssignment);
      
      if (!currentAssignment) {
        // Creating new assignment
        console.log('[PlannerDialogContainer] Creating new assignment, updating form date:', currentDate);
        setFormData(prev => ({
          ...prev,
          date: currentDate,
          cars: [] // Initialize with empty cars array
        }));
      } else {
        // Editing existing assignment - properly convert car and responsible user objects to IDs
        console.log('[PlannerDialogContainer] Editing existing assignment, converting data...');
        
        // Convert cars: handle both old single car format and new multiple cars format
        let carsArray: string[] = [];
        if (currentAssignment.cars && Array.isArray(currentAssignment.cars)) {
          // New format: already an array of car IDs
          carsArray = currentAssignment.cars;
        } else if (currentAssignment.car) {
          // Old format: single car, convert to array
          if (typeof currentAssignment.car === 'string') {
            carsArray = [currentAssignment.car];
          } else if (typeof currentAssignment.car === 'object' && currentAssignment.car.id) {
            carsArray = [currentAssignment.car.id];
          }
        }
        
        console.log('[PlannerDialogContainer] Converted cars array:', carsArray);
        console.log('[PlannerDialogContainer] Responsible user:', currentAssignment.responsibleUser);
        
        setFormData({
          date: currentAssignment.date,
          title: currentAssignment.title,
          description: currentAssignment.description || '',
          fromTime: currentAssignment.fromTime,
          toTime: currentAssignment.toTime,
          location: currentAssignment.location || '',
          cars: carsArray, // Use the converted cars array
          responsibleUser: currentAssignment.responsibleUser,
          employees: currentAssignment.employees || []
        });
      }
    }
  }, [isDialogOpen, currentAssignment, currentDate, setFormData]);
  
  // Update selected employees when the form data changes
  useEffect(() => {
    // Ensure we have a proper array of employee names
    if (formData.employees && Array.isArray(formData.employees)) {
      // Filter out any non-string values that might have gotten in
      const validEmployeeNames = formData.employees.filter(
        emp => typeof emp === 'string'
      );
      setSelectedEmployees(validEmployeeNames);
      
      // Debug logs
      console.log("[PlannerDialogContainer] Current Assignment:", currentAssignment);
      console.log("[PlannerDialogContainer] Form Data:", formData);
      console.log("[PlannerDialogContainer] Selected Day:", selectedDay || todayDate);
      console.log("[PlannerDialogContainer] Current Date Used:", currentDate);
      console.log("[PlannerDialogContainer] Selected Employees:", validEmployeeNames);
      console.log("[PlannerDialogContainer] Selected Cars:", formData.cars);
    } else {
      setSelectedEmployees([]);
    }
  }, [formData, currentAssignment, selectedDay, todayDate, currentDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    console.log(`[PlannerDialogContainer] handleSelectChange: ${name} =`, value);
    
    // Handle responsible user field mapping
    if (name === 'responsibleUserId') {
      setFormData(prev => ({ 
        ...prev, 
        responsibleUser: value ? { id: value as string, name: '' } : undefined 
      }));
    } else if (name === 'cars') {
      // Handle multiple cars selection
      setFormData(prev => ({ ...prev, cars: value as string[] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEmployeeToggle = (employeeName: string) => {
    setSelectedEmployees(prev => {
      const employeeExists = prev.includes(employeeName);
      
      // Create a new array to ensure React detects the change
      const updated = employeeExists
        ? prev.filter(name => name !== employeeName)
        : [...prev, employeeName];
        
      // Update the form data with the new employee selection
      setFormData(prevData => ({
        ...prevData,
        employees: updated
      }));
      
      return updated;
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleDeleteCurrentAssignment = () => {
    if (currentAssignment) {
      onDelete(currentAssignment.id);
      setIsDialogOpen(false);
    }
  };

  const handlePublishCurrentAssignment = () => {
    if (currentAssignment && onPublish) {
      onPublish(currentAssignment.id);
      setIsDialogOpen(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PlannerDialogContainer] Form submit with data:', formData);
    onSubmit(formData);
  };

  // Filter out the current assignment from the assignments list for employee availability check
  const otherAssignments = currentAssignment 
    ? assignments.filter(a => a.id !== currentAssignment.id) 
    : assignments;

  console.log(`[PlannerDialogContainer] Final current date: ${currentDate}`);
  console.log(`[PlannerDialogContainer] Today's date: ${todayDate}`);
  console.log(`[PlannerDialogContainer] Available assignments:`, otherAssignments);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AssignmentForm
        currentAssignment={currentAssignment}
        formData={formData}
        selectedEmployees={selectedEmployees}
        cars={cars || []}
        employees={employees || []}
        vacations={vacations || []}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleEmployeeToggle={handleEmployeeToggle}
        handleSubmit={handleFormSubmit}
        onClose={handleCloseDialog}
        currentDate={formData.date || currentDate}
        assignments={otherAssignments}
      />
    </Dialog>
  );
};

export default PlannerDialogContainer;
