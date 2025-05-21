
import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import AssignmentFormFields from './AssignmentFormFields';
import { EmployeeSelector } from './EmployeeSelector';
import { Car } from '../../types/car';
import { Employee } from '../../types/employee';
import { Vacation } from '../../types/vacation';
import { Assignment } from '../../types/assignment';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignmentFormProps {
  currentAssignment: any | null;
  formData: any;
  selectedEmployees: string[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleEmployeeToggle: (employeeName: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  currentDate: string;
  assignments?: Assignment[]; // Added this prop to make it optional
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  selectedEmployees,
  cars,
  employees,
  vacations,
  handleInputChange,
  handleSelectChange,
  handleEmployeeToggle,
  handleSubmit,
  onClose,
  currentDate,
  assignments = [], // Added default empty array
}) => {
  const { t } = useTranslation();
  
  // Create a function to handle field changes for AssignmentFormFields
  const handleFieldChange = (field: string, value: any) => {
    if (field === 'title' || field === 'description' || field === 'location') {
      const event = {
        target: {
          name: field,
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);
    } else if (field === 'car' && value === 'none') {
      // Convert "none" value to empty string for backward compatibility
      handleSelectChange(field, '');
    } else {
      handleSelectChange(field, value);
    }
  };

  console.log("AssignmentForm - Current formData:", formData);
  console.log("AssignmentForm - Selected employees:", selectedEmployees);
  console.log("AssignmentForm - Cars data:", cars);
  console.log("AssignmentForm - Employees data:", employees);
  console.log("AssignmentForm - Current date:", currentDate);
  
  return (
    <DialogContent className="max-w-md">
      <ScrollArea className="max-h-[80vh] pr-4">
        <div className="p-1">
          <DialogHeader>
            <DialogTitle>
              {currentAssignment ? t("planner.editAssignment") : t("planner.newAssignment")}
            </DialogTitle>
            <DialogDescription>
              {currentAssignment
                ? t("planner.updateDetails")
                : t("planner.addAssignment")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <AssignmentFormFields
              title={formData.title}
              setTitle={(value) => handleFieldChange('title', value)}
              location={formData.location}
              setLocation={(value) => handleFieldChange('location', value)}
              selectedDate={formData.date ? new Date(formData.date) : undefined}
              setSelectedDate={(date) => handleSelectChange('date', date ? formatDateToYYYYMMDD(date) : '')}
              fromTime={formData.fromTime}
              setFromTime={(value) => handleFieldChange('fromTime', value)}
              toTime={formData.toTime}
              setToTime={(value) => handleFieldChange('toTime', value)}
              description={formData.description}
              setDescription={(value) => handleFieldChange('description', value)}
              assignmentType={formData.type || ''}
              setAssignmentType={(value) => handleFieldChange('type', value)}
              selectedCarId={formData.car === '' ? 'none' : formData.car || 'none'}
              setSelectedCarId={(value) => handleFieldChange('car', value)}
              cars={cars}
              assignmentId={currentAssignment?.id}
            />
            
            {/* Employee multi-selector */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('planner.employees')}</h3>
              <EmployeeSelector
                employees={employees}
                selectedEmployees={selectedEmployees}
                onToggle={handleEmployeeToggle}
                vacations={vacations}
                currentDate={currentDate || formData.date}
                assignments={assignments} // Pass assignments to EmployeeSelector
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit"
                className="bg-polygon-purple hover:bg-polygon-darkpurple"
                disabled={!selectedEmployees || selectedEmployees.length === 0}
              >
                {currentAssignment ? t("planner.saveChanges") : t("planner.createAssignment")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

// Helper function to format date to YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default AssignmentForm;
