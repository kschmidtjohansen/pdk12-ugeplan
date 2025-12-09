import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useEmployeeStatus } from './hooks/useEmployeeStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';

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
  const { t } = useTranslation();
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
        status.hasEndTimeAtSixteen ? 'border-red-300 bg-red-50' : ''
      }`}
    >
      <span className={`font-medium ${
        status.hasEndTimeAtSixteen ? '!text-red-600 !font-bold' : ''
      }`}>
        {employee.name}
      </span>
      {status.vacationDetails ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <Badge className={status.color}>
                  {status.label}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{t('vacation.vacationDetails')}</p>
                <p className="text-xs">
                  {t('vacation.dateRange')}: {format(new Date(status.vacationDetails.startDate), 'dd/MM/yyyy')} - {format(new Date(status.vacationDetails.endDate), 'dd/MM/yyyy')}
                </p>
                {status.vacationDetails.requestType === 'partial_day' && status.vacationDetails.startTime && status.vacationDetails.endTime && (
                  <p className="text-xs">
                    {t('vacation.offHours', { 
                      startTime: status.vacationDetails.startTime, 
                      endTime: status.vacationDetails.endTime 
                    })}
                  </p>
                )}
                {status.vacationDetails.reason && (
                  <p className="text-xs text-muted-foreground">
                    {t('vacation.reason')}: {status.vacationDetails.reason}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Badge className={status.color}>
          {status.label}
        </Badge>
      )}
    </div>
  );
};
