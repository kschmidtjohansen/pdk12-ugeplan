
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

  // Use state to track selected employees, but only initialize it once when formData changes
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Update selected employees when formData.employees changes, but only when relevant
  useEffect(() => {
    if (formData.employees) {
      setSelectedEmployees(formData.employees);
    }
  }, [formData.id]); // Only update when formData.id changes (new assignment or edit)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'employees') {
      setFormData((prev) => ({
        ...prev,
        employees: value ? [value] : [],
      }));
      setSelectedEmployees(value ? [value] : []);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEmployeeToggle = (employeeName: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeName)) {
        return prev.filter(name => name !== employeeName);
      } else {
        return [...prev, employeeName];
      }
    });

    // Also update the formData
    setFormData((prev) => {
      const updatedEmployees = prev.employees ? [...prev.employees] : [];
      if (updatedEmployees.includes(employeeName)) {
        return {
          ...prev,
          employees: updatedEmployees.filter(name => name !== employeeName)
        };
      } else {
        return {
          ...prev,
          employees: [...updatedEmployees, employeeName]
        };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
