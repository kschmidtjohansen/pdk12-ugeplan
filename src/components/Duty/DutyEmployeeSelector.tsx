import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
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
      <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
        {filteredEmployees.map(employee => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
