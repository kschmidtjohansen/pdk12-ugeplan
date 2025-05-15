
import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import AssignmentForm from './AssignmentForm';
import { Assignment } from '@/types/assignment';

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
  
  // Track selected employees separately for better UI state management
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
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
      console.log("PlannerDialogContainer - Current Assignment:", currentAssignment);
      console.log("PlannerDialogContainer - Form Data:", formData);
    } else {
      setSelectedEmployees([]);
    }
  }, [formData, currentAssignment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    onSubmit(formData);
  };

  // Filter out the current assignment from the assignments list for employee availability check
  const otherAssignments = currentAssignment 
    ? assignments.filter(a => a.id !== currentAssignment.id) 
    : assignments;

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
        currentDate={selectedDay}
        assignments={otherAssignments} // Pass the filtered assignments
      />
    </Dialog>
  );
};

export default PlannerDialogContainer;
