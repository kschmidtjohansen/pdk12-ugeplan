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
import { Users } from 'lucide-react';
import { getEmployeeAvailabilityStatus, getEmployeeVacationStatus } from '@/utils/employeeAvailability';
import { shouldRemoveEmployeeFromAssignment } from '@/utils/employeeAssignmentUtils';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onToggle: (employeeId: string) => void;
  vacations: Vacation[];
  currentDate: string;
  assignments?: Assignment[];
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onToggle,
  vacations,
  currentDate,
  assignments = []
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [autoRemovedEmployees, setAutoRemovedEmployees] = useState<string[]>([]);

  // Show all employees for all user types
  const filteredEmployees = employees;

  // ROBUST date parsing for vacation check
  const dateForComparison = (() => {
    try {
      let dateStr: string;
      if (currentDate.includes('/')) {
        const [day, month, year] = currentDate.split('/');
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (currentDate.includes('T')) {
        dateStr = currentDate.split('T')[0];
      } else {
        dateStr = currentDate;
      }
      return new Date(dateStr + 'T12:00:00');
    } catch (e) {
      console.error('Error parsing date for vacation check:', e);
      return new Date();
    }
  })();

  // Check for employees that should be auto-removed when their availability changes
  useEffect(() => {
    const employeesToRemove: string[] = [];
    
    selectedEmployees.forEach(employeeName => {
      const employee = employees.find(emp => emp.name === employeeName);
      if (employee && shouldRemoveEmployeeFromAssignment(employee, currentDate, vacations)) {
        employeesToRemove.push(employeeName);
      }
    });

    if (employeesToRemove.length > 0) {
      console.log('[EmployeeSelector] Auto-removing unavailable employees:', employeesToRemove);
      setAutoRemovedEmployees(employeesToRemove);
      
      // Remove the unavailable employees
      employeesToRemove.forEach(employeeName => {
        onToggle(employeeName);
      });
    }
  }, [employees, vacations, currentDate, selectedEmployees, onToggle]);
  
  const getDisplayText = () => {
    if (selectedEmployees.length === 0) {
      return t('employees.selectEmployees');
    }
    if (selectedEmployees.length === 1) {
      return selectedEmployees[0];
    }
    // Updated to use the new translation key
    return `${selectedEmployees.length} ${t('employees.selected')}`;
  };

  useEffect(() => {
    console.log("EmployeeSelector - Current date:", currentDate);
    console.log("EmployeeSelector - Selected employees:", selectedEmployees);
    console.log("EmployeeSelector - User role:", user?.role);
    console.log("EmployeeSelector - Filtered employees count:", filteredEmployees.length);
    console.log("EmployeeSelector - All assignments:", assignments);
    console.log("EmployeeSelector - Date for comparison:", dateForComparison);
    console.log("EmployeeSelector - Auto-removed employees:", autoRemovedEmployees);
  }, [currentDate, selectedEmployees, assignments, user?.role, filteredEmployees.length, dateForComparison, autoRemovedEmployees]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('planner.employees')}</label>
      
      {/* Show notification if employees were auto-removed */}
      {autoRemovedEmployees.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          {t('employees.autoRemovedUnavailable')}: {autoRemovedEmployees.join(', ')}
        </div>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-11 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto z-50 bg-white border shadow-md">
          {filteredEmployees.map(employee => {
            const isSelected = selectedEmployees.includes(employee.name);
            
            // Get detailed vacation status
            const vacationStatus = getEmployeeVacationStatus(employee.id, dateForComparison, vacations);
            
            // Use manual on leave status (not vacation-based)
            const isManuallyOnLeave = employee.onLeave;
            
            // Get comprehensive availability info
            const availabilityInfo = getEmployeeAvailabilityStatus(employee, dateForComparison, assignments, vacations, t);
            
            // Employee is disabled only for full-day vacation OR manually on leave
            // Partial vacation employees should remain selectable
            const isDisabled = (vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day') || isManuallyOnLeave;
            
            // Apply red styling for workday end times with higher CSS specificity
            const hasRedStyling = availabilityInfo.status === 'fullyBooked';
            console.log(`[EmployeeSelector] Employee ${employee.name} red styling applied: ${hasRedStyling}, disabled: ${isDisabled}, vacation type: ${vacationStatus.vacationType}`);
            
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
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className={`font-medium ${hasRedStyling ? '!text-red-700 !font-bold' : ''}`}>
                        {employee.name}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      {vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day' && (
                        <Badge variant="outline" className="text-xs">
                          {t('planner.onVacation')}
                        </Badge>
                      )}
                      {vacationStatus.isOnVacation && vacationStatus.vacationType === 'partial_day' && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {availabilityInfo.statusText}
                        </Badge>
                      )}
                      {isManuallyOnLeave && (
                        <Badge variant="outline" className="text-xs">
                          {t('employees.onLeave')}
                        </Badge>
                      )}
                      {availabilityInfo.status !== 'available' && !vacationStatus.isOnVacation && !isDisabled && (
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
