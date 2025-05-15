
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
import { Textarea } from "@/components/ui/textarea";
import { Employee } from '@/types/employee';

interface EmployeeMarkLeaveDialogProps {
  employee: Employee | null;
  note: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const EmployeeMarkLeaveDialog: React.FC<EmployeeMarkLeaveDialogProps> = ({
  employee,
  note,
  onNoteChange,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();

  if (!employee) return null;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('employees.markOnLeaveTitle')}</DialogTitle>
        <DialogDescription>
          {t('employees.markOnLeaveDescription', { name: employee.name })}
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <Textarea
          placeholder={t('employees.notesPlaceholder')}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[100px]"
          autoFocus
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button onClick={onConfirm} disabled={!note.trim()}>
          {t('common.confirm')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EmployeeMarkLeaveDialog;
