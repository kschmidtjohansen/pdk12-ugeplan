
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
import { getEmployeeAvailabilityStatus, isEmployeeOnVacation } from '@/utils/employeeAvailability';

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
            const isOnVacation = isEmployeeOnVacation(employee.id, dateForComparison, vacations);
            const isUnavailable = employee.onLeave;
            const availabilityInfo = getEmployeeAvailabilityStatus(employee, dateForComparison, assignments, vacations, t);
            
            const isDisabled = isOnVacation || isUnavailable;
            
            // Apply red styling for workday end times with higher CSS specificity
            const hasRedStyling = availabilityInfo.status === 'fullyBooked';
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
                      {availabilityInfo.status !== 'available' && !isDisabled && (
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
