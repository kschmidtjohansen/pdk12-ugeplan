
import React from 'react';
import { Assignment } from '@/types/assignment';
import AssignmentForm from './AssignmentForm';
import { Dialog } from '@/components/ui/dialog';
import { Employee } from '@/types/employee';
import { Car } from '@/types/car';
import { useVacations } from '@/hooks/useVacations';

interface PlannerDialogContainerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Assignment>>>;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  selectedDay: string;
  onPublishDay: () => void;
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
  // Add debugging to track the form data as it passes through
  console.log("PlannerDialogContainer - Current Assignment:", currentAssignment);
  console.log("PlannerDialogContainer - Form Data:", formData);
  
  // Get vacations to pass to the assignment form
  const { vacations } = useVacations();

  // Only render the dialog when it's actually open
  if (!isDialogOpen) {
    return null;
  }

  // Extract selected employees from formData
  const selectedEmployees = formData.employees || [];
  
  // Handle field change coming from the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select change coming from the form
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle toggling employees
  const handleEmployeeToggle = (employeeName: string) => {
    setFormData(prev => {
      const employees = prev.employees || [];
      if (employees.includes(employeeName)) {
        return {
          ...prev,
          employees: employees.filter(e => e !== employeeName)
        };
      } else {
        return {
          ...prev,
          employees: [...employees, employeeName]
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AssignmentForm
        currentAssignment={currentAssignment}
        formData={formData}
        selectedEmployees={selectedEmployees}
        cars={[]} // We'll fetch cars from a hook in AssignmentForm
        employees={[]} // We'll fetch employees from a hook in AssignmentForm
        vacations={vacations}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleEmployeeToggle={handleEmployeeToggle}
        handleSubmit={handleSubmit}
        onClose={() => setIsDialogOpen(false)}
        currentDate={selectedDay}
      />
    </Dialog>
  );
};

export default PlannerDialogContainer;
