
import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog } from '@/components/ui/alert-dialog';
import EmployeeFormDialog from './EmployeeFormDialog';
import EmployeeDeleteDialog from './EmployeeDeleteDialog';
import { Employee } from '@/types/employee';
import { EmployeeFormData } from '@/hooks/employee/useEmployeeFormState';

interface EmployeeDialogManagerProps {
  dialogOpen: boolean;
  deleteDialogOpen: boolean;
  currentEmployee: Employee | null;
  formData: EmployeeFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
  handleCheckboxChange?: (field: string, checked: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onCloseDialog: () => void;
  onConfirmDelete: () => void;
  onCloseDeleteDialog: (open: boolean) => void;
}

const EmployeeDialogManager: React.FC<EmployeeDialogManagerProps> = ({
  dialogOpen,
  deleteDialogOpen,
  currentEmployee,
  formData,
  handleInputChange,
  handleSelectChange,
  handleCheckboxChange,
  handleSubmit,
  onCloseDialog,
  onConfirmDelete,
  onCloseDeleteDialog
}) => {
  return (
    <>
      {/* Employee Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={onCloseDialog}>
        <EmployeeFormDialog
          currentEmployee={currentEmployee}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleCheckboxChange={handleCheckboxChange}
          handleSubmit={handleSubmit}
          onClose={onCloseDialog}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={onCloseDeleteDialog}>
        <EmployeeDeleteDialog
          employee={currentEmployee}
          onConfirmDelete={onConfirmDelete}
        />
      </AlertDialog>
    </>
  );
};

export default EmployeeDialogManager;
