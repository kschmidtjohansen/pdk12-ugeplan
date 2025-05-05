
import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Employee } from './EmployeesList';

interface EmployeeDeleteDialogProps {
  employee: Employee | null;
  onConfirmDelete: () => void;
}

const EmployeeDeleteDialog: React.FC<EmployeeDeleteDialogProps> = ({ employee, onConfirmDelete }) => {
  const { t } = useTranslation();

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t("employees.deleteConfirm")}</AlertDialogTitle>
        <AlertDialogDescription>
          {employee && t("employees.deleteWarning", { name: employee.name })}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirmDelete} 
          className="bg-destructive hover:bg-destructive/90"
        >
          {t("common.delete")}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default EmployeeDeleteDialog;
