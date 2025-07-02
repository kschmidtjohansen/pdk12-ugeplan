
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { EmployeeAvailabilityInfo } from '@/utils/employeeAvailability';

interface EmployeeWithStatus extends Employee {
  availabilityStatus: EmployeeAvailabilityInfo;
}

interface EmployeeAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeWithStatus[];
  title: string;
}

const EmployeeAvailabilityModal: React.FC<EmployeeAvailabilityModalProps> = ({
  isOpen,
  onClose,
  employees,
  title
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {employees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('employees.noEmployees')}
            </p>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{employee.name}</h4>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                  {employee.jobTitle && (
                    <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    className={employee.availabilityStatus.badgeColor}
                    variant="outline"
                  >
                    {employee.availabilityStatus.statusText}
                  </Badge>
                  
                  {employee.availabilityStatus.availableAt && (
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.metrics.availableAfter', { 
                        time: employee.availabilityStatus.availableAt 
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

export default EmployeeAvailabilityModal;
