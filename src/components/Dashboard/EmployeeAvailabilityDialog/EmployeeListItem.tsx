
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useEmployeeStatus } from './hooks/useEmployeeStatus';
import EmployeeContactActions from '@/components/Shared/EmployeeContactActions';

interface EmployeeListItemProps {
  employee: Employee;
  currentDate: Date;
  assignments: Assignment[];
  vacations: Vacation[];
  viewedDate: string;
}

export const EmployeeListItem: React.FC<EmployeeListItemProps> = ({
  employee,
  currentDate,
  assignments,
  vacations,
  viewedDate
}) => {
  const status = useEmployeeStatus({
    employee,
    currentDate,
    assignments,
    vacations,
    viewedDate
  });

  return (
    <div
      key={employee.id}
      className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${
        status.hasEndTimeAtSixteen ? 'border-destructive/30 bg-destructive-soft' : ''
      }`}
    >
      <span className={`font-medium truncate ${
        status.hasEndTimeAtSixteen ? '!text-destructive !font-bold' : ''
      }`}>
        {employee.name}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <EmployeeContactActions phone={employee.phone} name={employee.name} />
        <Badge className={status.color}>
          {status.label}
        </Badge>
      </span>
    </div>
  );
};
