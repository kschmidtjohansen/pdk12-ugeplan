
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { EmployeeListItem } from './EmployeeListItem';
import { useTranslation } from '@/context/TranslationContext';

interface EmployeeListProps {
  employees: Employee[];
  currentDate: Date;
  assignments: Assignment[];
  vacations: Vacation[];
  viewedDate: string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  currentDate,
  assignments,
  vacations,
  viewedDate
}) => {
  const { t } = useTranslation();
  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-2">
        {employees.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            {t('dashboard.noEmployeesFoundForDate')}
          </div>
        ) : (
          employees.map(employee => (
            <EmployeeListItem
              key={employee.id}
              employee={employee}
              currentDate={currentDate}
              assignments={assignments}
              vacations={vacations}
              viewedDate={viewedDate}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
};
