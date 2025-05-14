
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '../../types/employee';
import { Vacation } from '../../types/vacation';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onToggle: (employeeName: string) => void;
  vacations: Vacation[];
  currentDate: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ 
  employees, 
  selectedEmployees, 
  onToggle, 
  vacations, 
  currentDate 
}) => {
  const { t } = useTranslation();
  
  // Function to check if an employee is on vacation for the selected date
  const isEmployeeOnVacation = (employeeId: string, date: string): boolean => {
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') return false;
      
      const selectedDate = new Date(date);
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      // Reset time portion for accurate date comparison
      selectedDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Fix: Employee is available on the day of their vacation end date
      // Changed from 'selectedDate <= endDate' to 'selectedDate < endDate'
      return selectedDate >= startDate && selectedDate < endDate;
    });
  };
  
  // Function to check if employee is unavailable (either on vacation or marked as onLeave)
  const isEmployeeUnavailable = (employee: Employee, date: string): boolean => {
    return isEmployeeOnVacation(employee.id, date) || employee.onLeave === true;
  };

  return (
    <div className="border rounded-md p-3 space-y-2">
      {employees.map((employee) => {
        const isUnavailable = isEmployeeUnavailable(employee, currentDate);
        return (
          <div 
            key={employee.id} 
            className={`flex items-center justify-between p-2 rounded ${isUnavailable ? 'bg-gray-100' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`employee-${employee.id}`}
                checked={selectedEmployees.includes(employee.name)}
                onCheckedChange={() => onToggle(employee.name)}
                disabled={isUnavailable}
                className={isUnavailable ? 'opacity-50' : ''}
              />
              <label
                htmlFor={`employee-${employee.id}`}
                className={`text-sm leading-none ${isUnavailable ? 'text-gray-400' : ''}`}
              >
                {employee.name}
              </label>
            </div>
            
            {isUnavailable && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                {t('planner.unavailable')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeSelector;
