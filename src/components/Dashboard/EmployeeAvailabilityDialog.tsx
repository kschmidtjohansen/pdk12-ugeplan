
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { CalendarIcon, UserIcon } from 'lucide-react';

interface EmployeeAvailabilityDialogProps {
  employees: Employee[];
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAvailable: boolean;
}

const EmployeeAvailabilityDialog: React.FC<EmployeeAvailabilityDialogProps> = ({
  employees,
  title,
  description,
  open,
  onOpenChange,
  isAvailable
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isAvailable 
                ? t('dashboard.noAvailableEmployees') 
                : t('dashboard.noUnavailableEmployees')}
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div 
                  key={employee.id} 
                  className="flex items-center p-3 border rounded-md bg-white hover:border-polygon-blue"
                >
                  <Avatar className="h-10 w-10 mr-3 bg-gray-100">
                    <UserIcon className="h-5 w-5" />
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{employee.name}</div>
                  </div>
                  {!isAvailable && employee.onApprovedVacation && (
                    <div className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {t('dashboard.onVacation')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAvailabilityDialog;
