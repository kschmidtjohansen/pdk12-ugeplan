
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { CalendarIcon, UserIcon, ArrowRight, Briefcase } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface EmployeeAvailabilityDialogProps {
  employees: Employee[];
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAvailable: boolean;
  viewDate?: Date;
  onViewDateChange?: (date: Date) => void;
  assignments?: Assignment[];
  allEmployees?: Employee[];
  vacations?: Vacation[];
}

const EmployeeAvailabilityDialog: React.FC<EmployeeAvailabilityDialogProps> = ({
  employees,
  title,
  description,
  open,
  onOpenChange,
  isAvailable,
  viewDate = new Date(),
  onViewDateChange,
  assignments = [],
  allEmployees = [],
  vacations = []
}) => {
  const { t } = useTranslation();
  const formattedDate = format(viewDate, 'yyyy-MM-dd');
  
  // Helper function to check if an employee is on vacation for a specific date
  const isEmployeeOnVacation = (employeeId: string, checkDate: string): boolean => {
    return vacations.some(vacation => 
      vacation.user_id === employeeId && 
      vacation.status === 'approved' && 
      vacation.start_date <= checkDate && 
      vacation.end_date > checkDate
    );
  };
  
  // Helper function to check if an employee is assigned to any task on a specific date
  const isEmployeeAssigned = (employeeId: string, checkDate: string): boolean => {
    // Find the employee name
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return false;
    
    // Check if employee name is in any assignment for the date
    return assignments.some(assignment => 
      assignment.date === checkDate && 
      assignment.employees.includes(employee.name)
    );
  };
  
  // If we're viewing available employees and have date navigation capability
  const filteredEmployeesToShow = isAvailable && onViewDateChange ? 
    allEmployees.filter(employee => {
      // Employee should not be on leave
      if (employee.onLeave) return false;
      
      // Employee should not be on vacation
      if (isEmployeeOnVacation(employee.id, formattedDate)) return false;
      
      // Include both assigned and unassigned employees
      return true;
    }) : 
    employees;

  // Handle click for tomorrow button
  const handleViewTomorrow = () => {
    if (onViewDateChange) {
      onViewDateChange(addDays(viewDate, 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {title}
              {isAvailable && onViewDateChange && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({format(viewDate, 'PP')})
                </span>
              )}
            </span>
            {isAvailable && onViewDateChange && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewTomorrow}
                className="flex items-center gap-1"
              >
                {t('dashboard.tomorrow')} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {filteredEmployeesToShow.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isAvailable 
                ? t('dashboard.noAvailableEmployees') 
                : t('dashboard.noUnavailableEmployees')}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployeesToShow.map((employee) => {
                const isAssigned = isAvailable && isEmployeeAssigned(employee.id, formattedDate);
                
                return (
                  <div 
                    key={employee.id} 
                    className="flex items-center p-3 border rounded-md bg-white hover:border-polygon-blue"
                  >
                    <Avatar className="h-10 w-10 mr-3 bg-gray-100">
                      <UserIcon className="h-5 w-5" />
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                    </div>
                    {isAvailable && isAssigned && (
                      <div className="flex items-center text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {t('dashboard.onAssignment')}
                      </div>
                    )}
                    {!isAvailable && employee.onApprovedVacation && (
                      <div className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {t('dashboard.onVacation')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAvailabilityDialog;
