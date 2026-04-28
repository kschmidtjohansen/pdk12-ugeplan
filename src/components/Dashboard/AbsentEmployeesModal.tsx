
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { EmployeeAvailabilityInfo } from '@/utils/employeeAvailability';
import { format } from 'date-fns';

interface AbsentEmployee extends Employee {
  availabilityStatus: EmployeeAvailabilityInfo;
  vacation?: Vacation;
}

interface AbsentEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: AbsentEmployee[];
  title: string;
  /** ISO yyyy-MM-dd context, currently informational. */
  selectedDate?: string;
}

const AbsentEmployeesModal: React.FC<AbsentEmployeesModalProps> = ({
  isOpen,
  onClose,
  employees,
  title
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {employees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              {t('employees.noEmployees')}
            </p>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{employee.name}</h4>
                  
                  {employee.vacation && (
                    <div className="mt-1 text-xs">
                      <p className="text-muted-foreground">
                        {format(new Date(employee.vacation.start_date), 'dd/MM/yyyy')} - {' '}
                        {format(new Date(employee.vacation.end_date), 'dd/MM/yyyy')}
                      </p>
                      {employee.vacation.reason && (
                        <p className="text-muted-foreground">{employee.vacation.reason}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    className={employee.availabilityStatus.badgeColor}
                    variant="outline"
                  >
                    {employee.availabilityStatus.statusText}
                  </Badge>
                  
                  {employee.vacation && (
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.metrics.returnsOn', { 
                        date: format(new Date(employee.vacation.end_date), 'dd/MM/yyyy')
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbsentEmployeesModal;
