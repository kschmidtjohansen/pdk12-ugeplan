
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';

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
  employees,
  assignments,
  vacations,
  selectedDate,
  title
}) => {
  const { t } = useTranslation();

  // Helper function to check if an employee is on vacation
  const isEmployeeOnVacation = (employeeId: string, date: string) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Helper function to get employee assignment status
  const getEmployeeStatus = (employee: Employee) => {
    const isOnVacation = isEmployeeOnVacation(employee.id, selectedDate);
    const isOnLeave = employee.onLeave;
    
    if (isOnVacation) return { status: 'vacation', label: t('dashboard.onVacation'), color: 'bg-orange-100 text-orange-800' };
    if (isOnLeave) return { status: 'leave', label: t('dashboard.onLeave'), color: 'bg-red-100 text-red-800' };

    const employeeAssignments = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const selectedDateObj = new Date(selectedDate);
      assignmentDate.setHours(0, 0, 0, 0);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      return assignmentDate.getTime() === selectedDateObj.getTime() &&
             assignment.employees &&
             assignment.employees.includes(employee.name);
    });

    if (employeeAssignments.length === 0) {
      return { status: 'available', label: t('common.available'), color: 'bg-green-100 text-green-800' };
    }

    // Check if employee has assignment ending at 16:00 (should be red)
    const hasEndTimeAtSixteen = employeeAssignments.some(assignment => assignment.toTime === "16:00");
    
    if (hasEndTimeAtSixteen) {
      return { status: 'fullyBooked', label: t('dashboard.fullyBooked'), color: 'bg-red-600 text-white border-red-700' };
    }

    // Check if fully booked
    const dayOfWeek = new Date(selectedDate).getDay();
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00";
    
    let totalCoverage = false;
    const sortedAssignments = [...employeeAssignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
    // Simple check for full day coverage
    if (sortedAssignments.length > 0) {
      const firstStart = sortedAssignments[0].fromTime;
      const lastEnd = sortedAssignments[sortedAssignments.length - 1].toTime;
      
      if (firstStart <= "08:00" && lastEnd >= workdayEnd) {
        totalCoverage = true;
      }
    }

    if (totalCoverage) {
      return { status: 'fullyBooked', label: t('dashboard.fullyBooked'), color: 'bg-red-100 text-red-800' };
    }

    return { status: 'partiallyAvailable', label: t('dashboard.partiallyAvailable'), color: 'bg-yellow-100 text-yellow-800' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('dashboard.employeeAvailability')} - {selectedDate}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {employees.map((employee) => {
              const status = getEmployeeStatus(employee);
              return (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <span className="font-medium">{employee.name}</span>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAvailabilityDialog;
