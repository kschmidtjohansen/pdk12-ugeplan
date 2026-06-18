import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectScrollUpButton, SelectScrollDownButton } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { DutyType } from '@/types/duty';
import { useActiveTrainings } from '@/hooks/useActiveTrainings';

interface Employee {
  id: string;
  name: string;
  role?: string;
}

interface DutyEmployeeSelectorProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (employeeId: string) => void;
  dutyType: DutyType;
}

export const DutyEmployeeSelector = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  dutyType,
}: DutyEmployeeSelectorProps) => {
  const { t } = useTranslation();
  const { trainingIds } = useActiveTrainings();

  // Filter employees based on duty type
  const filteredEmployees = dutyType === 'skadeleder_vagt'
    ? employees.filter(emp => 
        emp.role === 'super_admin' || emp.role === 'administrator' || emp.role === 'skadeleder'
      )
    : employees;

  return (
    <Select value={selectedEmployeeId} onValueChange={onSelectEmployee}>
      <SelectTrigger>
        <SelectValue placeholder={t('duty.selectEmployee')} />
      </SelectTrigger>
      <SelectContent 
        position="popper" 
        className="max-h-[300px] overflow-y-auto"
        style={{ 
          maxHeight: '300px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <SelectScrollUpButton className="flex items-center justify-center py-1">
          <ChevronUp className="h-4 w-4" />
        </SelectScrollUpButton>
        
        <div className="max-h-[270px] overflow-y-auto">
          {filteredEmployees.map(employee => {
            const isOnTraining = trainingIds.has(employee.id);
            return (
              <SelectItem
                key={employee.id}
                value={employee.id}
                disabled={isOnTraining}
              >
                <span className="flex items-center gap-2">
                  {employee.name}
                  {isOnTraining && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
                      Kursus
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </div>
        
        <SelectScrollDownButton className="flex items-center justify-center py-1">
          <ChevronDown className="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </Select>
  );
};
