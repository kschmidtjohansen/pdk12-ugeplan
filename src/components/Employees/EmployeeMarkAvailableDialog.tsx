
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Employee } from '@/types/employee';

interface EmployeeMarkAvailableDialogProps {
  employee: Employee | null;
  onConfirmWithNote: () => void;
  onConfirmWithoutNote: () => void;
  onCancel: () => void;
}

const EmployeeMarkAvailableDialog: React.FC<EmployeeMarkAvailableDialogProps> = ({
  employee,
  onConfirmWithNote,
  onConfirmWithoutNote,
  onCancel
}) => {
  const { t } = useTranslation();
  
  if (!employee) return null;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('employees.markAvailableTitle')}</DialogTitle>
        <DialogDescription>
          {t('employees.markAvailableDescription', { name: employee.name })}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="flex-col space-y-2 sm:space-y-0">
        <Button onClick={onConfirmWithoutNote} variant="outline">
          {t('employees.removeNote')}
        </Button>
        <Button onClick={onConfirmWithNote}>
          {t('employees.keepNote')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EmployeeMarkAvailableDialog;
