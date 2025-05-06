
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, UserSquare2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vacation } from '@/types/vacation';
import { format, isBefore, isAfter } from 'date-fns';
import { Employee } from '@/types/employee';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onChange: (selected: string[]) => void;
  vacations: Vacation[];
  assignmentDate: Date | null;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onChange,
  vacations,
  assignmentDate,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  // Function to check if employee is on vacation on the assignment date
  const isOnVacation = (employeeId: string) => {
    if (!assignmentDate) return false;
    
    return vacations.some(
      (vacation) =>
        vacation.employeeId === employeeId &&
        vacation.status === 'approved' &&
        isBefore(assignmentDate, vacation.endDate) &&
        isAfter(assignmentDate, vacation.startDate)
    );
  };

  // Function to toggle employee selection
  const toggleEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    
    // Check if employee is on leave or on vacation
    if ((employee && employee.onLeave) || isOnVacation(employeeId)) {
      return; // Do not allow selecting employees on leave or vacation
    }
    
    const newSelectedEmployees = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter((id) => id !== employeeId)
      : [...selectedEmployees, employeeId];
      
    onChange(newSelectedEmployees);
  };

  // Get display name with vacation status
  const getEmployeeDisplayName = (employee: Employee) => {
    if (employee.onLeave) {
      return `${employee.name} (${t('employees.onLeave')})`;
    }
    
    if (isOnVacation(employee.id)) {
      return `${employee.name} (${t('planner.onVacation')})`;
    }
    
    return employee.name;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedEmployees.length > 0
              ? `${selectedEmployees.length} ${t('planner.employees')} ${t('common.selected')}`
              : t('planner.selectEmployee')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" side="bottom">
          <Command>
            <CommandInput placeholder={t('planner.selectEmployee')} />
            <CommandList>
              <CommandEmpty>{t('common.noResultsFound')}</CommandEmpty>
              <CommandGroup>
                {employees.map((employee) => {
                  const isOnLeave = employee.onLeave;
                  const isOnVac = isOnVacation(employee.id);
                  const isSelected = selectedEmployees.includes(employee.id);
                  const isDisabled = isOnLeave || isOnVac;
                  
                  return (
                    <CommandItem
                      key={employee.id}
                      value={employee.id}
                      onSelect={() => toggleEmployee(employee.id)}
                      disabled={isDisabled}
                      className={cn(
                        isDisabled && "opacity-50 cursor-not-allowed",
                        isOnLeave && "text-red-500",
                        isOnVac && "text-amber-500"
                      )}
                    >
                      <div className="flex items-center">
                        <UserSquare2 className="mr-2 h-4 w-4" />
                        <span>{getEmployeeDisplayName(employee)}</span>
                      </div>
                      
                      {isSelected && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedEmployees.length === 0 && (
        <p className="text-sm text-red-500">
          {t('planner.selectAtLeastOneEmployee')}
        </p>
      )}
      
      <div className="flex flex-wrap gap-1 mt-2">
        {selectedEmployees.map((employeeId) => {
          const employee = employees.find((e) => e.id === employeeId);
          if (!employee) return null;
          
          return (
            <div
              key={employeeId}
              className="bg-primary/10 text-primary rounded px-2 py-1 text-xs flex items-center"
            >
              <span>{employee.name}</span>
              <button
                type="button"
                onClick={() => toggleEmployee(employeeId)}
                className="ml-1 text-primary hover:text-primary/80"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeSelector;
