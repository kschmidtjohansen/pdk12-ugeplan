
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
import { CalendarIcon, UserIcon, ArrowRight, Briefcase } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const { t, currentLanguage } = useTranslation();
  const formattedDate = format(viewDate, 'yyyy-MM-dd');
  
  // Helper function to check if an employee is on vacation for a specific date
  const isEmployeeOnVacation = (employeeId: string, checkDate: string): boolean => {
    return vacations.some(vacation => 
      vacation.employeeId === employeeId && 
      vacation.status === 'approved' && 
      format(vacation.startDate, 'yyyy-MM-dd') <= checkDate && 
      format(vacation.endDate, 'yyyy-MM-dd') > checkDate
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
  
  // Helper function to determine if an employee is unavailable on a specific date
  const isEmployeeUnavailable = (employee: Employee, checkDate: string): boolean => {
    // Employee is unavailable if they are on leave
    if (employee.onLeave) return true;
    
    // Employee is unavailable if they are on vacation
    if (isEmployeeOnVacation(employee.id, checkDate)) return true;
    
    return false;
  };
  
  // Filter employees based on availability for the current view date
  const filteredEmployeesToShow = isAvailable && onViewDateChange ? 
    allEmployees.filter(employee => {
      // For available employees view, only show employees who are NOT unavailable
      if (isEmployeeUnavailable(employee, formattedDate)) return false;
      
      // UPDATED: Also exclude employees who are assigned to tasks on this date
      if (isEmployeeAssigned(employee.id, formattedDate)) return false;
      
      // Include only truly available employees (not on leave, not on vacation, not assigned)
      return true;
    }) : 
    !isAvailable && onViewDateChange ?
    // For unavailable employees view, only show employees who ARE unavailable
    allEmployees.filter(employee => isEmployeeUnavailable(employee, formattedDate)) :
    // Fall back to provided employees list if no date navigation
    employees;

  // Handle click for tomorrow button
  const handleViewTomorrow = () => {
    if (onViewDateChange) {
      onViewDateChange(addDays(viewDate, 1));
    }
  };

  // Handle click for yesterday button
  const handleViewYesterday = () => {
    if (onViewDateChange) {
      onViewDateChange(subDays(viewDate, 1));
    }
  };

  // Format the date for display with proper locale
  const getFormattedViewDate = () => {
    try {
      // Use Danish locale if the current language is Danish
      const locale = currentLanguage === 'da' ? da : undefined;
      const dateStr = format(viewDate, 'PPP', { locale });
      
      // Capitalize first letter for Danish dates
      if (currentLanguage === 'da') {
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }
      return dateStr;
    } catch (e) {
      console.error("Error formatting view date:", e);
      return format(new Date(), 'PPP');
    }
  };

  // Check if we're viewing today's date
  const viewingToday = isToday(viewDate);

  // Get the appropriate title based on whether we're viewing today or another date
  const getDialogTitle = () => {
    // If we're viewing today's date, add "Dagens" before the title for Danish
    if (viewingToday && currentLanguage === 'da') {
      return isAvailable ? 'Tilgængelige Servicemedarbejdere' : 'Fraværende Servicemedarbejdere';
    }
    return title;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            {onViewDateChange && (
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleViewYesterday}
                      >
                        <ArrowRight className="h-4 w-4 transform rotate-180" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('dashboard.yesterday')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleViewTomorrow}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('dashboard.tomorrow')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          
          {onViewDateChange && (
            <div className="text-sm text-muted-foreground mt-1">
              {viewingToday 
                ? t('dashboard.todaysDate', { date: getFormattedViewDate() })
                : t('dashboard.viewingDate', { date: getFormattedViewDate() })
              }
            </div>
          )}
          
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
                const isVacation = isEmployeeOnVacation(employee.id, formattedDate);
                
                return (
                  <div 
                    key={employee.id} 
                    className="flex items-center p-3 border rounded-md bg-white hover:border-polygon-blue"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                    </div>
                    {isAvailable && isAssigned && (
                      <div className="flex items-center text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {t('dashboard.onAssignment')}
                      </div>
                    )}
                    {!isAvailable && isVacation && (
                      <div className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {t('dashboard.onVacation')}
                      </div>
                    )}
                    {!isAvailable && employee.onLeave && !isVacation && (
                      <div className="flex items-center text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {t('employees.onLeave')}
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
