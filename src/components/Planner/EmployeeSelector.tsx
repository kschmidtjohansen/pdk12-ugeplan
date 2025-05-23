
import React, { useEffect } from 'react';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';

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
  availableAt?: string; // Time when employee becomes available
  latestAssignmentEndTime?: string; // Latest end time of employee's assignments for the day
  isFullyBooked: boolean; // Whether employee is booked for the full workday
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

  // Helper function to check if an employee is on vacation
  const isEmployeeOnVacation = (employeeId: string, selectedDate: Date) => {
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      // Normalize dates to avoid time comparison issues
      selectedDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Fix: Employee is available on the day after their vacation ends
      return selectedDate >= startDate && selectedDate < endDate;
    });
  };

  // Helper function to format time to HH:MM without seconds
  const formatTimeWithoutSeconds = (time: string): string => {
    // If time format is HH:MM:SS, remove the seconds part
    if (time && time.length === 8 && time.includes(':')) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Function to determine if an employee is fully booked for the workday based on their assignments
  const isEmployeeFullyBookedForDay = (assignments: Assignment[], dayOfWeek: number): boolean => {
    // Standard work hours: Mon-Thu: 08:00-16:00, Fri: 08:00-15:30
    const workdayStart = "08:00";
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00"; // Friday ends at 15:30, other days at 16:00
    
    // Check if there are assignments covering the entire workday
    let coveredTimeSlots: [string, string][] = [];
    
    // Sort assignments by time
    const sortedAssignments = [...assignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
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

  // Enhanced function to check if an employee is already assigned to another assignment
  // Returns detailed information about assignment times
  const checkEmployeeAvailability = (employeeName: string): EmployeeAvailabilityInfo => {
    // Create a date object from the currentDate string for proper comparison
    const currentDateObj = new Date(currentDate);
    currentDateObj.setHours(0, 0, 0, 0);
    
    console.log(`Checking if ${employeeName} has assignment on date: ${currentDate} (${currentDateObj.toISOString()})`);
    
    // Find all assignments for this employee on the current date
    const employeeAssignments = assignments.filter(assignment => {
      // Convert assignment date to Date object for comparison
      const assignmentDateObj = new Date(assignment.date);
      assignmentDateObj.setHours(0, 0, 0, 0);
      
      const isOnDate = assignmentDateObj.getTime() === currentDateObj.getTime();
      const isAssigned = assignment.employees.includes(employeeName);
      
      if (isOnDate && isAssigned) {
        console.log(`${employeeName} is assigned to task "${assignment.title}" on ${assignment.date} (${assignment.fromTime}-${assignment.toTime})`);
      }
      
      return isOnDate && isAssigned;
    });
    
    // If no assignments found, employee is fully available
    if (employeeAssignments.length === 0) {
      return { isAssigned: false, isFullyBooked: false };
    }
    
    // Get the day of the week to determine workday end time
    const dayOfWeek = currentDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if the employee is fully booked for the day
    const fullyBooked = isEmployeeFullyBookedForDay(employeeAssignments, dayOfWeek);
    
    // Find the latest end time among all assignments
    let latestEndTime = "00:00";
    employeeAssignments.forEach(assignment => {
      if (assignment.toTime > latestEndTime) {
        latestEndTime = assignment.toTime;
      }
    });
    
    // Check if the latest end time is the end of workday
    // Standard work end times: Mon-Thu: 16:00, Fri: 15:30
    const isEndOfWorkDay = 
      (dayOfWeek === 5 && latestEndTime === "15:30") || // Friday
      (dayOfWeek >= 1 && dayOfWeek <= 4 && latestEndTime === "16:00"); // Mon-Thu
    
    return { 
      isAssigned: true, 
      availableAt: isEndOfWorkDay || fullyBooked ? undefined : formatTimeWithoutSeconds(latestEndTime),
      latestAssignmentEndTime: formatTimeWithoutSeconds(latestEndTime),
      isFullyBooked: fullyBooked
    };
  };

  // Parse the current date string into a Date object for comparison
  const dateForComparison = currentDate ? new Date(currentDate) : new Date();
  
  // Debug the employee selection data
  useEffect(() => {
    console.log("EmployeeSelector - Current date:", currentDate);
    console.log("EmployeeSelector - Selected employees:", selectedEmployees);
    console.log("EmployeeSelector - Assignments for date:", 
      assignments.filter(a => {
        const aDate = new Date(a.date);
        const cDate = new Date(currentDate);
        aDate.setHours(0, 0, 0, 0);
        cDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === cDate.getTime();
      })
    );
  }, [currentDate, selectedEmployees, assignments]);

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {employees.map(employee => {
        // Check if the employee is selected by matching their name
        const isSelected = selectedEmployees.includes(employee.name);
        const isOnVacation = isEmployeeOnVacation(employee.id, dateForComparison);
        const isUnavailable = employee.onLeave;
        const availabilityInfo = checkEmployeeAvailability(employee.name);
        
        // Employee should be disabled if they're on vacation or marked as unavailable
        const isDisabled = isOnVacation || isUnavailable;
        
        return (
          <div
            key={employee.id}
            onClick={() => !isDisabled && onToggle(employee.name)}
            className={`
              p-2 rounded-md border cursor-pointer transition-colors
              ${isSelected ? 'bg-polygon-purple text-white' : 'bg-white text-gray-700'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
            `}
          >
            <div className="flex items-center gap-2">
              <span>{employee.name}</span>
              {isOnVacation && <Badge variant="outline">{t('planner.onVacation')}</Badge>}
              {isUnavailable && <Badge variant="outline">{t('employees.onLeave')}</Badge>}
              {availabilityInfo.isAssigned && !isDisabled && (
                availabilityInfo.isFullyBooked ? (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {t('planner.onAnotherAssignment')}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {availabilityInfo.availableAt 
                      ? t('planner.onAnotherAssignmentUntil', { time: availabilityInfo.availableAt })
                      : t('planner.onAnotherAssignment')}
                  </Badge>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Add a default export for compatibility
export default EmployeeSelector;
