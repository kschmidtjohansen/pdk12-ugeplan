
import React, { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import AssignmentForm from './AssignmentForm';

interface Car {
  id: string;
  name: string;
}

interface AssignmentDialogManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignment: Assignment | null;
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  onSubmit: (formData: Partial<Assignment>, selectedEmployees: string[]) => void;
}

const AssignmentDialogManager: React.FC<AssignmentDialogManagerProps> = ({
  open,
  onOpenChange,
  currentAssignment,
  cars,
  employees,
  vacations,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    fromTime: '',
    toTime: '',
    location: '',
    car: '',
  });

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Update form data when currentAssignment changes
  React.useEffect(() => {
    if (currentAssignment) {
      setFormData({
        id: currentAssignment.id,
        title: currentAssignment.title,
        description: currentAssignment.description,
        date: currentAssignment.date,
        fromTime: currentAssignment.fromTime,
        toTime: currentAssignment.toTime,
        location: currentAssignment.location,
        car: currentAssignment.car,
      });
      setSelectedEmployees(currentAssignment.employees || []);
    } else {
      // Reset form when opening for a new assignment
      setFormData({
        id: '',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        fromTime: '',
        toTime: '',
        location: '',
        car: '',
      });
      setSelectedEmployees([]);
    }
  }, [currentAssignment, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeToggle = (employeeName: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeName)) {
        return prev.filter(name => name !== employeeName);
      } else {
        return [...prev, employeeName];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, selectedEmployees);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AssignmentForm 
        currentAssignment={currentAssignment}
        formData={formData}
        selectedEmployees={selectedEmployees}
        cars={cars}
        employees={employees}
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
