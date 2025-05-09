
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import AssignmentForm from './AssignmentForm';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/useCars';
import { useVacations } from '@/hooks/useVacations';

interface AssignmentDialogManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: boolean;
  formData: Partial<Assignment>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Assignment>>>;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  selectedDay: string;
  onPublishDay: () => void;
}

const AssignmentDialogManager: React.FC<AssignmentDialogManagerProps> = ({
  open,
  onOpenChange,
  editMode,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onPublish,
  assignments,
  selectedDay,
  onPublishDay
}) => {
  // Get cars from the hook
  const { cars } = useCars();

  // Use the hook to get the full employee objects and vacations
  const { employees: allEmployees } = useEmployees();
  const { vacations } = useVacations();
  
  // Use state to track selected employees
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Initialize selected employees ONLY when the dialog opens with new formData
  useEffect(() => {
    if (open && formData.employees) {
      setSelectedEmployees(Array.isArray(formData.employees) ? [...formData.employees] : []);
    } else if (open && !formData.employees) {
      // Initialize with empty array to avoid null/undefined
      setSelectedEmployees([]);
    }
  }, [open, formData.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'employees') {
      // For the dropdown, just update with a single employee
      const newEmployees = value ? [value] : [];
      
      setFormData(prev => ({
        ...prev,
        employees: newEmployees,
      }));
      setSelectedEmployees(newEmployees);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEmployeeToggle = (employeeName: string) => {
    // Create a new array for selectedEmployees to prevent direct state mutation
    setSelectedEmployees(prev => {
      const newSelection = [...prev];
      const index = newSelection.indexOf(employeeName);
      
      if (index !== -1) {
        newSelection.splice(index, 1);
      } else {
        newSelection.push(employeeName);
      }
      
      return newSelection;
    });

    // Also update the formData with the new employee selection
    setFormData(prev => {
      // Ensure we're working with an array
      const updatedEmployees = Array.isArray(prev.employees) ? [...prev.employees] : [];
      const index = updatedEmployees.indexOf(employeeName);
      
      if (index !== -1) {
        updatedEmployees.splice(index, 1);
      } else {
        updatedEmployees.push(employeeName);
      }
      
      return {
        ...prev,
        employees: updatedEmployees
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure formData.employees is updated with selectedEmployees before submission
    setFormData(prev => ({
      ...prev,
      employees: selectedEmployees
    }));
    
    // Use setTimeout to ensure state is updated before form submission
    setTimeout(() => {
      onSubmit({
        ...formData,
        employees: selectedEmployees
      });
    }, 0);
  };

  // Reset selected employees when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEmployees([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AssignmentForm 
        currentAssignment={editMode ? formData as Assignment : null}
        formData={formData}
        selectedEmployees={selectedEmployees}
        cars={cars}
        employees={allEmployees}
        vacations={vacations}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleEmployeeToggle={handleEmployeeToggle}
        handleSubmit={handleSubmit}
        onClose={() => onOpenChange(false)}
        currentDate={selectedDay}
      />
    </Dialog>
  );
};

export default AssignmentDialogManager;
