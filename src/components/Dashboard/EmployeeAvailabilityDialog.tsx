
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
  availableAt?: string; // Time when employee becomes available
  latestEndTime?: string; // Latest end time of assignments for the day
  isFullyBooked: boolean; // Whether employee is booked for the full workday
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
    // If time format is HH:MM:SS, remove the seconds part
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
    // Get the day of the week for the check date
    const dateObj = new Date(checkDate);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Standard work hours: Mon-Thu: 08:00-16:00, Fri: 08:00-15:30
    const workdayStart = "08:00";
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00"; // Friday ends at 15:30, other days at 16:00
    
    // Check if there are assignments covering the entire workday
    let coveredTimeSlots: [string, string][] = [];
    
    // Sort assignments by time
    const sortedAssignments = [...employeeAssignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
    // Add each assignment's time range to coveredTimeSlots
    for (const assignment of sortedAssignments) {
      const from = assignment.fromTime;
      const to = assignment.toTime;
      
      // Check if this assignment time range fully covers the workday
      if (from <= workdayStart && to >= workdayEnd) {
        return true;
      }
      
      // Add this time slot
      coveredTimeSlots.push([from, to]);
    }
    
    // If we have multiple assignments, check if they collectively cover the workday
    if (coveredTimeSlots.length > 1) {
      // Sort time slots
      coveredTimeSlots.sort((a, b) => a[0].localeCompare(b[0]));
      
      // Merge overlapping time slots
      let merged: [string, string][] = [];
      let current = coveredTimeSlots[0];
      
      for (let i = 1; i < coveredTimeSlots.length; i++) {
        if (current[1] >= coveredTimeSlots[i][0]) {
          // Overlapping slots, merge them
          current[1] = coveredTimeSlots[i][1] > current[1] ? coveredTimeSlots[i][1] : current[1];
        } else {
          // No overlap, add the current slot and move to the next one
          merged.push(current);
          current = coveredTimeSlots[i];
        }
      }
      merged.push(current);
      
      // Now check if the merged slots cover the entire workday
      for (const [from, to] of merged) {
        if (from <= workdayStart && to >= workdayEnd) {
          return true;
        }
      }
      
      // Check if the combined slots cover the entire workday
      // This handles cases where multiple assignments collectively cover the day
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
  // Returns detailed information about assignment times
  const getEmployeeAssignmentInfo = (employeeId: string, checkDate: string): EmployeeAssignmentInfo => {
    // Find the employee name
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return { isAssigned: false, isFullyBooked: false };

    // Find all assignments for this employee on the given date
    const employeeAssignments = assignments.filter(assignment => 
      assignment.date === checkDate && assignment.employees.includes(employee.name)
    );
    
    // If no assignments found, employee is fully available
    if (employeeAssignments.length === 0) {
      return { isAssigned: false, isFullyBooked: false };
    }
    
    // Check if the employee is fully booked
    const fullyBooked = isEmployeeFullyBookedForDay(employeeAssignments, checkDate);
    
    // Find the latest end time among all assignments
    let latestEndTime = "00:00";
    employeeAssignments.forEach(assignment => {
      if (assignment.toTime > latestEndTime) {
        latestEndTime = assignment.toTime;
      }
    });
    
    // Check if the latest end time is the end of workday
    // Standard work end times: Mon-Thu: 16:00, Fri: 15:30
    const assignmentDate = new Date(checkDate);
    const dayOfWeek = assignmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isEndOfWorkDay = 
      (dayOfWeek === 5 && latestEndTime === "15:30") || // Friday
      (dayOfWeek >= 1 && dayOfWeek <= 4 && latestEndTime === "16:00"); // Mon-Thu
    
    return { 
      isAssigned: true,
      availableAt: isEndOfWorkDay || fullyBooked ? undefined : formatTimeWithoutSeconds(latestEndTime),
      latestEndTime: formatTimeWithoutSeconds(latestEndTime),
      isFullyBooked: fullyBooked
    };
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
  const filteredEmployeesToShow = isAvailable && onViewDateChange ? allEmployees.filter(employee => {
    // For available employees view, only show employees who are NOT unavailable
    if (isEmployeeUnavailable(employee, formattedDate)) return false;

    // Get assignment information
    const assignmentInfo = getEmployeeAssignmentInfo(employee.id, formattedDate);
    
    // For available view, also exclude employees who are fully booked for the day
    if (assignmentInfo.isAssigned && assignmentInfo.isFullyBooked) return false;

    // Include only truly available employees or those who will be available later
    return true;
  }) : !isAvailable && onViewDateChange ?
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
      const dateStr = format(viewDate, 'PPP', {
        locale
      });

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
  
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            {onViewDateChange && <div className="flex items-center gap-2 py-[20px]">
                <TooltipProvider>
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
                
                <TooltipProvider>
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
            // For available employees, check if they have assignments but will be available later
            const assignmentInfo = isAvailable ? getEmployeeAssignmentInfo(employee.id, formattedDate) : null;
            const isAssigned = assignmentInfo && assignmentInfo.isAssigned;
            const isVacation = isEmployeeOnVacation(employee.id, formattedDate);
            return <div key={employee.id} className="flex items-center p-3 border rounded-md bg-white hover:border-polygon-blue">
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                    </div>
                    {isAvailable && isAssigned && (
                      <div className={`flex items-center text-xs ${assignmentInfo?.isFullyBooked ? 
                        'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'} px-2 py-1 rounded`}>
                        <Briefcase className="h-3 w-3 mr-1" />
                        {assignmentInfo?.isFullyBooked ? 
                          t('planner.onAnotherAssignment') : 
                          (assignmentInfo?.availableAt ? 
                          t('planner.onAnotherAssignmentUntil', { time: assignmentInfo.availableAt }) :
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
