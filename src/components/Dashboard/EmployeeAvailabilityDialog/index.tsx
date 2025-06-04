
import React from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { DateNavigation } from './DateNavigation';
import { EmployeeList } from './EmployeeList';
import { useEmployeeDialogData } from './hooks/useEmployeeDialogData';

interface EmployeeAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  assignments: Assignment[];
  vacations: Vacation[];
  selectedDate: string;
  title: string;
}

export const EmployeeAvailabilityDialog: React.FC<EmployeeAvailabilityDialogProps> = ({
  open,
  onOpenChange,
  employees: initialEmployees,
  assignments,
  vacations,
  selectedDate,
  title
}) => {
  const { currentLanguage } = useTranslation();
  
  const {
    viewedDate,
    setViewedDate,
    currentDate,
    employeesToShow
  } = useEmployeeDialogData({
    initialEmployees,
    selectedDate,
    assignments,
    vacations
  });

  console.log(`[EmployeeAvailabilityDialog] === DIALOG DEBUG INFO ===`);
  console.log(`[EmployeeAvailabilityDialog] Dialog title: ${title}`);
  console.log(`[EmployeeAvailabilityDialog] Initial selected date: ${selectedDate}`);
  console.log(`[EmployeeAvailabilityDialog] Currently viewed date: ${viewedDate}`);
  console.log(`[EmployeeAvailabilityDialog] Date changed: ${viewedDate !== selectedDate}`);
  console.log(`[EmployeeAvailabilityDialog] Initial employees passed: ${initialEmployees.length}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DateNavigation
            title={title}
            currentDate={currentDate}
            viewedDate={viewedDate}
            setViewedDate={setViewedDate}
            currentLanguage={currentLanguage}
          />
        </DialogHeader>
        
        <EmployeeList
          employees={employeesToShow}
          currentDate={currentDate}
          assignments={assignments}
          vacations={vacations}
          viewedDate={viewedDate}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAvailabilityDialog;
