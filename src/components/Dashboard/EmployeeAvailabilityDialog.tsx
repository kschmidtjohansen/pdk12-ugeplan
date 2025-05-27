
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, UserIcon, ArrowRight, Briefcase } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { da } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

type EmployeeAssignmentInfo = {
  isAssigned: boolean;
  availableAt?: string;
  latestEndTime?: string;
  isFullyBooked: boolean;
  hasEndTimeAtSixteen: boolean;
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
  const {
    t,
    currentLanguage
  } = useTranslation();
  const formattedDate = format(viewDate, 'yyyy-MM-dd');

  // Helper function to format time to HH:MM without seconds
  const formatTimeWithoutSeconds = (time: string): string => {
    if (time && time.length === 8 && time.includes(':')) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Helper function to check if an employee is on vacation for a specific date
  const isEmployeeOnVacation = (employeeId: string, checkDate: string): boolean => {
    return vacations.some(vacation => vacation.employeeId === employeeId && vacation.status === 'approved' && format(vacation.startDate, 'yyyy-MM-dd') <= checkDate && format(vacation.endDate, 'yyyy-MM-dd') > checkDate);
  };

  // Function to determine if an employee is fully booked for the workday based on their assignments
  const isEmployeeFullyBookedForDay = (employeeAssignments: Assignment[], checkDate: string): boolean => {
    const dateObj = new Date(checkDate);
    const dayOfWeek = dateObj.getDay();
    
    const workdayStart = "08:00";
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00";
    
    let coveredTimeSlots: [string, string][] = [];
    
    const sortedAssignments = [...employeeAssignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
    for (const assignment of sortedAssignments) {
      const from = assignment.fromTime;
      const to = assignment.toTime;
      
      if (from <= workdayStart && to >= workdayEnd) {
        return true;
      }
      
      coveredTimeSlots.push([from, to]);
    }
    
    if (coveredTimeSlots.length > 1) {
      coveredTimeSlots.sort((a, b) => a[0].localeCompare(b[0]));
      
      let merged: [string, string][] = [];
      let current = coveredTimeSlots[0];
      
      for (let i = 1; i < coveredTimeSlots.length; i++) {
        if (current[1] >= coveredTimeSlots[i][0]) {
          current[1] = coveredTimeSlots[i][1] > current[1] ? coveredTimeSlots[i][1] : current[1];
        } else {
          merged.push(current);
          current = coveredTimeSlots[i];
        }
      }
      merged.push(current);
      
      for (const [from, to] of merged) {
        if (from <= workdayStart && to >= workdayEnd) {
          return true;
        }
      }
      
      if (merged.length > 0) {
        const earliestStart = merged[0][0];
        const latestEnd = merged[merged.length - 1][1];
        
        if (earliestStart <= workdayStart && latestEnd >= workdayEnd) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Enhanced helper function to check if an employee is assigned to any task on a specific date
  const getEmployeeAssignmentInfo = (employeeId: string, checkDate: string): EmployeeAssignmentInfo => {
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return { isAssigned: false, isFullyBooked: false, hasEndTimeAtSixteen: false };

    const employeeAssignments = assignments.filter(assignment => 
      assignment.date === checkDate && assignment.employees && assignment.employees.includes(employee.name)
    );
    
    if (employeeAssignments.length === 0) {
      return { isAssigned: false, isFullyBooked: false, hasEndTimeAtSixteen: false };
    }
    
    const hasEndTimeAtSixteen = employeeAssignments.some(assignment => assignment.toTime === "16:00");
    
    const fullyBooked = isEmployeeFullyBookedForDay(employeeAssignments, checkDate);
    
    let latestEndTime = "00:00";
    employeeAssignments.forEach(assignment => {
      if (assignment.toTime > latestEndTime) {
        latestEndTime = assignment.toTime;
      }
    });
    
    const assignmentDate = new Date(checkDate);
    const dayOfWeek = assignmentDate.getDay();
    const isEndOfWorkDay = 
      (dayOfWeek === 5 && latestEndTime === "15:30") ||
      (dayOfWeek >= 1 && dayOfWeek <= 4 && latestEndTime === "16:00");
    
    return { 
      isAssigned: true,
      availableAt: isEndOfWorkDay || fullyBooked ? undefined : formatTimeWithoutSeconds(latestEndTime),
      latestEndTime: formatTimeWithoutSeconds(latestEndTime),
      isFullyBooked: fullyBooked,
      hasEndTimeAtSixteen
    };
  };

  // Helper function to determine if an employee is unavailable on a specific date
  const isEmployeeUnavailable = (employee: Employee, checkDate: string): boolean => {
    if (employee.onLeave) return true;
    if (isEmployeeOnVacation(employee.id, checkDate)) return true;
    return false;
  };

  // Filter employees based on availability for the current view date
  const filteredEmployeesToShow = isAvailable && onViewDateChange ? allEmployees.filter(employee => {
    if (isEmployeeUnavailable(employee, formattedDate)) return false;
    const assignmentInfo = getEmployeeAssignmentInfo(employee.id, formattedDate);
    if (assignmentInfo.isAssigned && assignmentInfo.isFullyBooked) return false;
    return true;
  }) : !isAvailable && onViewDateChange ?
  allEmployees.filter(employee => isEmployeeUnavailable(employee, formattedDate)) :
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
      const locale = currentLanguage === 'da' ? da : undefined;
      const dateStr = format(viewDate, 'PPP', {
        locale
      });

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
    if (viewingToday && currentLanguage === 'da') {
      return isAvailable ? 'Tilgængelige Servicemedarbejdere' : 'Fraværende Servicemedarbejdere';
    }
    return title;
  };
  
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            {onViewDateChange && <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleViewYesterday}>
                        <ArrowRight className="h-4 w-4 transform rotate-180" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('dashboard.yesterday')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleViewTomorrow}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('dashboard.tomorrow')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>}
          </div>
          
          {onViewDateChange && <div className="text-sm text-muted-foreground mt-1">
              {viewingToday ? t('dashboard.todaysDate', {
            date: getFormattedViewDate()
          }) : t('dashboard.viewingDate', {
            date: getFormattedViewDate()
          })}
            </div>}
          
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {filteredEmployeesToShow.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              {isAvailable ? t('dashboard.noAvailableEmployees') : t('dashboard.noUnavailableEmployees')}
            </div> : <div className="space-y-3">
              {filteredEmployeesToShow.map(employee => {
            const assignmentInfo = isAvailable ? getEmployeeAssignmentInfo(employee.id, formattedDate) : null;
            const isAssigned = assignmentInfo && assignmentInfo.isAssigned;
            const isVacation = isEmployeeOnVacation(employee.id, formattedDate);
            const hasEndTimeAtSixteen = assignmentInfo?.hasEndTimeAtSixteen || false;
            
            return <div key={employee.id} className="flex items-center p-3 border rounded-md bg-white hover:border-polygon-blue">
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                    </div>
                    {isAvailable && isAssigned && (
                      <div className={`flex items-center text-xs ${
                        hasEndTimeAtSixteen ? 'bg-red-500 text-white border-red-600' : 
                        assignmentInfo?.isFullyBooked ? 'bg-red-100 text-red-800 border-red-200' : 
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      } px-2 py-1 rounded border`}>
                        <Briefcase className="h-3 w-3 mr-1" />
                        {assignmentInfo?.isFullyBooked ? 
                          t('planner.onAnotherAssignment') : 
                          (assignmentInfo?.availableAt ? 
                          `På anden opgave til ${assignmentInfo.availableAt}` :
                          t('planner.onAnotherAssignment'))}
                      </div>
                    )}
                    {!isAvailable && isVacation && <div className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {t('dashboard.onVacation')}
                      </div>}
                    {!isAvailable && employee.onLeave && !isVacation && <div className="flex items-center text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {t('employees.onLeave')}
                      </div>}
                  </div>;
          })}
            </div>}
        </ScrollArea>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};

export default EmployeeAvailabilityDialog;
