
import React, { useEffect, useState } from 'react';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onToggle: (employeeId: string) => void;
  vacations: Vacation[];
  currentDate: string;
  assignments?: Assignment[];
}

type EmployeeAvailabilityInfo = {
  isAssigned: boolean;
  availableAt?: string;
  latestAssignmentEndTime?: string;
  isFullyBooked: boolean;
  hasEndTimeAtSixteen: boolean;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onToggle,
  vacations,
  currentDate,
  assignments = []
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Show all employees for all user types
  const filteredEmployees = employees;

  // Helper function to check if an employee is on vacation - FIXED to include end date
  const isEmployeeOnVacation = (employeeId: string, selectedDate: Date) => {
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      selectedDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // FIXED: Include the end date in vacation period (was < endDate, now <= endDate)
      return selectedDate >= startDate && selectedDate <= endDate;
    });
  };

  // Helper function to format time to HH:MM without seconds
  const formatTimeWithoutSeconds = (time: string): string => {
    if (time && time.length === 8 && time.includes(':')) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Function to determine if an employee is fully booked for the workday
  const isEmployeeFullyBookedForDay = (assignments: Assignment[], dayOfWeek: number): boolean => {
    const workdayStart = "08:00";
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00";
    
    let coveredTimeSlots: [string, string][] = [];
    const sortedAssignments = [...assignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
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

  // Enhanced function to check employee availability
  const checkEmployeeAvailability = (employeeName: string): EmployeeAvailabilityInfo => {
    const currentDateObj = new Date(currentDate);
    currentDateObj.setHours(0, 0, 0, 0);
    
    const employeeAssignments = assignments.filter(assignment => {
      const assignmentDateObj = new Date(assignment.date);
      assignmentDateObj.setHours(0, 0, 0, 0);
      
      const isOnDate = assignmentDateObj.getTime() === currentDateObj.getTime();
      const isAssigned = assignment.employees && assignment.employees.includes(employeeName);
      
      return isOnDate && isAssigned;
    });
    
    if (employeeAssignments.length === 0) {
      return { isAssigned: false, isFullyBooked: false, hasEndTimeAtSixteen: false };
    }
    
    // Check for 16:00 end time - this is the key fix
    const hasEndTimeAtSixteen = employeeAssignments.some(assignment => assignment.toTime === "16:00");
    console.log(`[EmployeeSelector] Employee ${employeeName} has 16:00 end time:`, hasEndTimeAtSixteen);
    
    const dayOfWeek = currentDateObj.getDay();
    const fullyBooked = isEmployeeFullyBookedForDay(employeeAssignments, dayOfWeek);
    
    let latestEndTime = "00:00";
    employeeAssignments.forEach(assignment => {
      if (assignment.toTime > latestEndTime) {
        latestEndTime = assignment.toTime;
      }
    });
    
    const isEndOfWorkDay = 
      (dayOfWeek === 5 && latestEndTime === "15:30") ||
      (dayOfWeek >= 1 && dayOfWeek <= 4 && latestEndTime === "16:00");
    
    return { 
      isAssigned: true, 
      availableAt: isEndOfWorkDay || fullyBooked ? undefined : formatTimeWithoutSeconds(latestEndTime),
      latestAssignmentEndTime: formatTimeWithoutSeconds(latestEndTime),
      isFullyBooked: fullyBooked,
      hasEndTimeAtSixteen
    };
  };

  const dateForComparison = currentDate ? new Date(currentDate) : new Date();
  
  const getDisplayText = () => {
    if (selectedEmployees.length === 0) {
      return t('employees.selectEmployees');
    }
    if (selectedEmployees.length === 1) {
      return selectedEmployees[0];
    }
    return `${selectedEmployees.length} ${t('employees.selected')}`;
  };

  useEffect(() => {
    console.log("EmployeeSelector - Current date:", currentDate);
    console.log("EmployeeSelector - Selected employees:", selectedEmployees);
    console.log("EmployeeSelector - User role:", user?.role);
    console.log("EmployeeSelector - Filtered employees count:", filteredEmployees.length);
  }, [currentDate, selectedEmployees, assignments, user?.role, filteredEmployees.length]);

  return (
    <div className="space-y-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto">
          {filteredEmployees.map(employee => {
            const isSelected = selectedEmployees.includes(employee.name);
            const isOnVacation = isEmployeeOnVacation(employee.id, dateForComparison);
            const isUnavailable = employee.onLeave;
            const availabilityInfo = checkEmployeeAvailability(employee.name);
            
            const isDisabled = isOnVacation || isUnavailable;
            
            // Enhanced red styling for 16:00 end times
            const hasRedStyling = availabilityInfo.hasEndTimeAtSixteen;
            console.log(`[EmployeeSelector] Employee ${employee.name} red styling:`, hasRedStyling);
            
            return (
              <DropdownMenuItem
                key={employee.id}
                className={`flex items-center space-x-2 p-2 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${hasRedStyling ? 'bg-red-50 border-l-4 border-red-600' : ''}`}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isDisabled) {
                    onToggle(employee.name);
                  }
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => !isDisabled && onToggle(employee.name)}
                  disabled={isDisabled}
                  className="mr-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${hasRedStyling ? 'text-red-600 font-bold' : ''}`}>
                      {employee.name}
                    </span>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      {isOnVacation && (
                        <Badge variant="outline" className="text-xs">
                          {t('planner.onVacation')}
                        </Badge>
                      )}
                      {isUnavailable && (
                        <Badge variant="outline" className="text-xs">
                          {t('employees.onLeave')}
                        </Badge>
                      )}
                      {availabilityInfo.isAssigned && !isDisabled && (
                        availabilityInfo.isFullyBooked || hasRedStyling ? (
                          <Badge className={`text-xs font-medium ${hasRedStyling ? 'bg-red-600 text-white border-red-700' : 'bg-red-100 text-red-800 border-red-200'}`}>
                            {t('planner.fullyBooked')}
                          </Badge>
                        ) : (
                          <Badge className={`text-xs ${hasRedStyling ? 'bg-red-600 text-white border-red-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                            {availabilityInfo.availableAt 
                              ? t('planner.availableAfter', { time: availabilityInfo.availableAt })
                              : t('planner.onAnotherAssignment')}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EmployeeSelector;
