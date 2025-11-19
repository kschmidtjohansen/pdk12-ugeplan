import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectScrollUpButton, SelectScrollDownButton } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { DutyType } from '@/types/duty';

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

  // Filter employees based on duty type
  const filteredEmployees = dutyType === 'skadeleder_vagt'
    ? employees.filter(emp => 
        emp.role === 'administrator' || emp.role === 'skadeleder'
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
          {filteredEmployees.map(employee => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.name}
            </SelectItem>
          ))}
        </div>
        
        <SelectScrollDownButton className="flex items-center justify-center py-1">
          <ChevronDown className="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </Select>
  );
};
