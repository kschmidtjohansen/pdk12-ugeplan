
import React, { useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types/employee';

interface EmployeeSelectorProps {
  selectedEmployees: string[];
  onEmployeeToggle: (employeeId: string) => void;
}

const EmployeeSelector = ({ selectedEmployees, onEmployeeToggle }: EmployeeSelectorProps) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { vacations } = useVacations();

  // Compute employee availability status based on vacations
  const employeeStatus = useMemo(() => {
    const status: Record<string, { onLeave: boolean, reason?: string }> = {};

    employees.forEach(employee => {
      status[employee.id] = { onLeave: employee.onLeave || false };
    });

    // Update status based on current vacations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    vacations.forEach(vacation => {
      if (vacation.status === 'approved') {
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);
        
        if (today >= startDate && today <= endDate) {
          status[vacation.employeeId] = { 
            onLeave: true, 
            reason: t('vacation.onVacation')
          };
        }
      }
    });

    return status;
  }, [employees, vacations, t]);

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEmployees.length > 0
            ? `${selectedEmployees.length} ${t('planner.employeesSelected')}`
            : t('planner.selectEmployee')}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t('planner.searchEmployees')} />
          <CommandEmpty>{t('planner.noEmployeesFound')}</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-auto">
            {employees.map((employee) => {
              const isSelected = selectedEmployees.includes(employee.id);
              const status = employeeStatus[employee.id];
              return (
                <CommandItem
                  key={employee.id}
                  onSelect={() => {
                    onEmployeeToggle(employee.id);
                    setOpen(true); // Keep popover open after selection
                  }}
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <span className="flex-grow">{employee.name}</span>
                  {status?.onLeave && (
                    <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800 border-yellow-200">
                      {status.reason || t('employees.onLeave')}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { EmployeeSelector };
