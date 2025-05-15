
import React from 'react';
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

  // Helper function to check if an employee is already assigned to another assignment
  const isEmployeeOnAnotherAssignment = (employeeName: string): boolean => {
    return assignments.some(assignment => 
      assignment.date === currentDate && 
      assignment.employees.includes(employeeName)
    );
  };

  // Parse the current date string into a Date object for comparison
  const dateForComparison = currentDate ? new Date(currentDate) : new Date();
  
  // Debug the selected employees
  console.log("EmployeeSelector - Selected employees:", selectedEmployees);
  console.log("EmployeeSelector - Available employees:", employees.map(e => e.name));

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {employees.map(employee => {
        // Check if the employee is selected by matching their name
        const isSelected = selectedEmployees.includes(employee.name);
        const isOnVacation = isEmployeeOnVacation(employee.id, dateForComparison);
        const isUnavailable = employee.onLeave;
        const isOnAnotherAssignment = isEmployeeOnAnotherAssignment(employee.name);
        
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
              {isOnAnotherAssignment && !isDisabled && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {t('planner.onAnotherAssignment')}
                </Badge>
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
