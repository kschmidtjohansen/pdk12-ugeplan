import React, { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import AssignmentForm from './AssignmentForm';
import { useEmployees } from '@/hooks/useEmployees';
import { Car } from '@/types/car';

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
  // Updated to match the Car type from Supabase
  const cars: Car[] = [
    { 
      id: '1', 
      name: 'Van 1', 
      car_number: 'V1', 
      number_plate: 'AB123CD', 
      fuel_card_code: '1234',
      has_trailer_hitch: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '2', 
      name: 'Van 2', 
      car_number: 'V2', 
      number_plate: 'EF456GH', 
      fuel_card_code: '2345',
      has_trailer_hitch: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '3', 
      name: 'Van 3', 
      car_number: 'V3', 
      number_plate: 'IJ789KL', 
      fuel_card_code: '3456',
      has_trailer_hitch: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '4', 
      name: 'Truck 3', 
      car_number: 'T3', 
      number_plate: 'MN012OP', 
      fuel_card_code: '4567',
      has_trailer_hitch: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '5', 
      name: 'Sedan 1', 
      car_number: 'S1', 
      number_plate: 'QR345ST', 
      fuel_card_code: '5678',
      has_trailer_hitch: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
  ];

  // Use the hook to get the full employee objects
  const { employees: allEmployees } = useEmployees();
  
  const vacations: Vacation[] = [];

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(formData.employees || []);

  // Update selected employees when formData changes
  React.useEffect(() => {
    setSelectedEmployees(formData.employees || []);
  }, [formData]);

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
