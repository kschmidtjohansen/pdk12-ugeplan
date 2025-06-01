
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
  status: 'available' | 'partiallyBooked' | 'fullyBooked';
  statusText: string;
  badgeColor: string;
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

  // ENHANCED: Improved time normalization function
  const normalizeTime = (time: string): string => {
    if (!time) return '';
    
    // Remove seconds if present (HH:MM:SS -> HH:MM)
    if (time.length === 8 && time.includes(':')) {
      time = time.substring(0, 5);
    }
    
    // Ensure we have HH:MM format
    if (time.length === 5 && time.includes(':')) {
      return time;
    }
    
    // Handle edge cases
    return time.trim();
  };

  // Function to determine if an employee is fully booked for the workday
  const isEmployeeFullyBookedForDay = (assignments: Assignment[], dayOfWeek: number): boolean => {
    const workdayStart = "08:00";
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00";
    
    let coveredTimeSlots: [string, string][] = [];
    const sortedAssignments = [...assignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
    for (const assignment of sortedAssignments) {
      const from = normalizeTime(assignment.fromTime);
      const to = normalizeTime(assignment.toTime);
      
      if (from <= workdayStart && to >= workdayEnd) {
        return true;
      }
      
      coveredTimeSlots.push([from, to]);
    }
    
    return false;
  };

  // FIXED: Much improved function to check employee availability with proper status determination
  const checkEmployeeAvailability = (employeeName: string): EmployeeAvailabilityInfo => {
    // FIXED: Better date parsing with proper timezone handling
    let currentDateObj: Date;
    try {
      // Parse the date properly to avoid timezone issues
      const dateStr = currentDate.includes('T') ? currentDate.split('T')[0] : currentDate;
      currentDateObj = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone edge cases
      
      console.log(`[EmployeeSelector] Parsing date: "${currentDate}" -> "${dateStr}" -> ${currentDateObj.toISOString()}`);
      
      if (isNaN(currentDateObj.getTime())) {
        console.error(`[EmployeeSelector] Invalid currentDate: ${currentDate}`);
        currentDateObj = new Date(); // Fallback to today
      }
    } catch (e) {
      console.error(`[EmployeeSelector] Error parsing currentDate: ${currentDate}`, e);
      currentDateObj = new Date(); // Fallback to today
    }
    
    // FIXED: Better date comparison using normalized date strings
    const targetDateStr = currentDateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Filter assignments for this employee on the current date with improved date comparison
    const employeeAssignments = assignments.filter(assignment => {
      // Normalize assignment date to YYYY-MM-DD format
      const assignmentDateStr = assignment.date.includes('T') ? assignment.date.split('T')[0] : assignment.date;
      
      const isOnDate = assignmentDateStr === targetDateStr;
      const isAssigned = assignment.employees && assignment.employees.includes(employeeName);
      
      console.log(`[EmployeeSelector] Assignment ${assignment.id} for ${employeeName}:`);
      console.log(`  - Assignment date: "${assignment.date}" -> normalized: "${assignmentDateStr}"`);
      console.log(`  - Target date: "${targetDateStr}"`);
      console.log(`  - Date match: ${isOnDate}`);
      console.log(`  - Employee assigned: ${isAssigned}`);
      
      return isOnDate && isAssigned;
    });
    
    console.log(`[EmployeeSelector] Employee ${employeeName} assignments on ${targetDateStr}:`, employeeAssignments);
    
    if (employeeAssignments.length === 0) {
      return { 
        isAssigned: false, 
        isFullyBooked: false, 
        hasEndTimeAtSixteen: false,
        status: 'available',
        statusText: t('dashboard.available'),
        badgeColor: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    
    // Check if employee ends at exactly 16:00
    const hasEndTimeAtSixteen = employeeAssignments.some(assignment => {
      const originalTime = assignment.toTime;
      const normalizedEndTime = normalizeTime(originalTime);
      const exactMatch = normalizedEndTime === "16:00";
      
      console.log(`[EmployeeSelector] Assignment ${assignment.id} for ${employeeName}:`);
      console.log(`  - Original time: "${originalTime}"`);
      console.log(`  - Normalized time: "${normalizedEndTime}"`);
      console.log(`  - Exact 16:00 match: ${exactMatch}`);
      
      return exactMatch;
    });
    
    console.log(`[EmployeeSelector] Employee ${employeeName} has 16:00 end time: ${hasEndTimeAtSixteen}`);
    
    // Get the latest end time
    let latestEndTime = "00:00";
    employeeAssignments.forEach(assignment => {
      const normalizedTime = normalizeTime(assignment.toTime);
      if (normalizedTime > latestEndTime) {
        latestEndTime = normalizedTime;
      }
    });
    
    // PRIORITY 1: Red for exactly 16:00 end time
    if (hasEndTimeAtSixteen) {
      return { 
        isAssigned: true, 
        availableAt: undefined,
        latestAssignmentEndTime: latestEndTime,
        isFullyBooked: true,
        hasEndTimeAtSixteen: true,
        status: 'fullyBooked',
        statusText: t('planner.fullyBooked'),
        badgeColor: '!bg-red-600 !text-white !border-red-700'
      };
    }
    
    // PRIORITY 2: Check if fully booked for the workday
    const dayOfWeek = currentDateObj.getDay();
    const fullyBooked = isEmployeeFullyBookedForDay(employeeAssignments, dayOfWeek);
    
    if (fullyBooked) {
      return { 
        isAssigned: true, 
        availableAt: undefined,
        latestAssignmentEndTime: latestEndTime,
        isFullyBooked: true,
        hasEndTimeAtSixteen: false,
        status: 'fullyBooked',
        statusText: t('planner.fullyBooked'),
        badgeColor: 'bg-red-100 text-red-800 border-red-200'
      };
    }
    
    // PRIORITY 3: Yellow for partially booked (booked until a specific time)
    return { 
      isAssigned: true, 
      availableAt: latestEndTime,
      latestAssignmentEndTime: latestEndTime,
      isFullyBooked: false,
      hasEndTimeAtSixteen: false,
      status: 'partiallyBooked',
      statusText: `Booket til kl. ${latestEndTime}`,
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  };

  // FIXED: Better date parsing for vacation check
  const dateForComparison = (() => {
    try {
      const dateStr = currentDate.includes('T') ? currentDate.split('T')[0] : currentDate;
      return new Date(dateStr + 'T12:00:00');
    } catch (e) {
      console.error('Error parsing date for vacation check:', e);
      return new Date();
    }
  })();
  
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
    console.log("EmployeeSelector - All assignments:", assignments);
    console.log("EmployeeSelector - Date for comparison:", dateForComparison);
  }, [currentDate, selectedEmployees, assignments, user?.role, filteredEmployees.length, dateForComparison]);

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
            
            // Apply red styling for 16:00 end times with higher CSS specificity
            const hasRedStyling = availabilityInfo.hasEndTimeAtSixteen;
            console.log(`[EmployeeSelector] Employee ${employee.name} red styling applied: ${hasRedStyling}`);
            
            return (
              <DropdownMenuItem
                key={employee.id}
                className={`flex items-center space-x-2 p-2 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${hasRedStyling ? '!bg-red-50 !border-l-4 !border-red-600 hover:!bg-red-100' : ''}`}
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
                    <span className={`font-medium ${hasRedStyling ? '!text-red-700 !font-bold' : ''}`}>
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
                        <Badge className={`text-xs font-medium ${availabilityInfo.badgeColor}`}>
                          {availabilityInfo.statusText}
                        </Badge>
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
