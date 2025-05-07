
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import AssignmentForm from './AssignmentForm';

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
  onSubmit,
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: formattedToday,
    fromTime: '09:00',
    toTime: '17:00',
    location: '',
    car: ''
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Reset form when dialog opens or currentAssignment changes
  useEffect(() => {
    if (currentAssignment) {
      setFormData({
        title: currentAssignment.title || '',
        description: currentAssignment.description || '',
        date: currentAssignment.date || formattedToday,
        fromTime: currentAssignment.fromTime || '09:00',
        toTime: currentAssignment.toTime || '17:00',
        location: currentAssignment.location || '',
        car: currentAssignment.car || ''
      });
      setSelectedEmployees(currentAssignment.employees || []);
    } else {
      setFormData({
        title: '',
        description: '',
        date: formattedToday,
        fromTime: '09:00',
        toTime: '17:00',
        location: '',
        car: ''
      });
      setSelectedEmployees([]);
    }
  }, [currentAssignment, open, formattedToday]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEmployees.length === 0) {
      toast({
        title: t("planner.selectAtLeastOneEmployee"),
        variant: "destructive"
      });
      return;
    }
    
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
