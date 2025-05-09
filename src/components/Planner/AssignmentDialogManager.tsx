
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import AssignmentForm from './AssignmentForm';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/useCars';

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

  // Use the hook to get the full employee objects
  const { employees: allEmployees } = useEmployees();
  
  const vacations: Vacation[] = [];

  // Use state to track selected employees
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Initialize selected employees ONLY when the dialog opens with new formData
  useEffect(() => {
    if (open && formData.employees) {
      setSelectedEmployees([...formData.employees]);
    }
  }, [open, formData.id]); // Only update when the dialog opens or formData.id changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'employees') {
      setFormData(prev => ({
        ...prev,
        employees: value ? [value] : [],
      }));
      setSelectedEmployees(value ? [value] : []);
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
      const updatedEmployees = prev.employees ? [...prev.employees] : [];
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
    onSubmit(formData);
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
      />
    </Dialog>
  );
};

export default AssignmentDialogManager;
