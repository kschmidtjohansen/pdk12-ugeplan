
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useEmployeeStatus } from './hooks/useEmployeeStatus';

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
      className={`flex items-center justify-between p-2 rounded-lg border ${
        status.hasEndTimeAtSixteen ? 'border-destructive/30 bg-destructive-soft' : ''
      }`}
    >
      <span className={`font-medium ${
        status.hasEndTimeAtSixteen ? '!text-destructive !font-bold' : ''
      }`}>
        {employee.name}
      </span>
      <Badge className={status.color}>
        {status.label}
      </Badge>
    </div>
  );
};
