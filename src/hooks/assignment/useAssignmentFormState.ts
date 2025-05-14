
import { useState, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car } from '@/types/car';

export interface AssignmentFormData {
  date: string;
  title?: string;
  description?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  car?: string;
  employees?: string[];
}

export const useAssignmentFormState = (
  employees: Employee[],
  cars: Car[],
  assignments: Assignment[],
  fetchAssignments: () => void,
  currentAssignment: Assignment | null,
  setCurrentAssignment: (assignment: Assignment | null) => void,
  setDialogOpen: (open: boolean) => void,
  selectedDate: string
) => {
  // State for form data
  const [formData, setFormData] = useState<AssignmentFormData>({
    date: selectedDate || new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  // Handle input changes for text fields
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle employee selection
  const handleEmployeeChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      employees: [value]
    }));
  }, []);

  // Handle car selection
  const handleCarChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      car: value
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAssignment: Partial<Assignment> = {
      ...formData,
      id: currentAssignment?.id,
      published: currentAssignment?.published || false
    };
    
    if (currentAssignment) {
      // We're updating an existing assignment
      console.log("Updating assignment:", updatedAssignment);
    } else {
      // We're creating a new assignment
      console.log("Creating new assignment:", updatedAssignment);
    }
    
    // Close the dialog and refresh assignments
    setDialogOpen(false);
    fetchAssignments();
  }, [formData, currentAssignment, setDialogOpen, fetchAssignments]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleEmployeeChange,
    handleCarChange,
    handleSubmit
  };
};
