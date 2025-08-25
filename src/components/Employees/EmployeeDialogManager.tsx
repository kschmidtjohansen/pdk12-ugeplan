
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog } from '@/components/ui/alert-dialog';
import EmployeeFormDialog from './EmployeeFormDialog';
import EmployeeDeleteDialog from './EmployeeDeleteDialog';
import EmployeeMarkLeaveDialog from './EmployeeMarkLeaveDialog';
import EmployeeMarkAvailableDialog from './EmployeeMarkAvailableDialog';
import { Employee } from '@/types/employee';
import { EmployeeFormData } from '@/hooks/employee/useEmployeeFormState';

interface EmployeeDialogManagerProps {
  dialogOpen: boolean;
  deleteDialogOpen: boolean;
  markLeaveDialogOpen: boolean;
  markAvailableDialogOpen: boolean;
  currentEmployee: Employee | null;
  formData: EmployeeFormData;
  employeeNote: string;
  creationType?: 'employee' | 'vikar' | 'edit';
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
  handleCheckboxChange?: (field: string, checked: boolean) => void;
  handleNoteChange: (note: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onCloseDialog: () => void;
  onConfirmDelete: () => void;
  onCloseDeleteDialog: (open: boolean) => void;
  onConfirmMarkLeave: () => void;
  onCancelMarkLeave: () => void;
  onConfirmMarkAvailableWithNote: () => void;
  onConfirmMarkAvailableWithoutNote: () => void;
  onCancelMarkAvailable: () => void;
}

const EmployeeDialogManager: React.FC<EmployeeDialogManagerProps> = ({
  dialogOpen,
  deleteDialogOpen,
  markLeaveDialogOpen,
  markAvailableDialogOpen,
  currentEmployee,
  formData,
  employeeNote,
  creationType = 'edit',
  handleInputChange,
  handleSelectChange,
  handleCheckboxChange,
  handleNoteChange,
  handleSubmit,
  onCloseDialog,
  onConfirmDelete,
  onCloseDeleteDialog,
  onConfirmMarkLeave,
  onCancelMarkLeave,
  onConfirmMarkAvailableWithNote,
  onConfirmMarkAvailableWithoutNote,
  onCancelMarkAvailable
}) => {
  return (
    <>
      {/* Employee Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={onCloseDialog}>
        <EmployeeFormDialog
          currentEmployee={currentEmployee}
          formData={formData}
          creationType={creationType}
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
      
      {/* Mark as Leave Dialog */}
      <Dialog open={markLeaveDialogOpen} onOpenChange={onCancelMarkLeave}>
        <EmployeeMarkLeaveDialog
          employee={currentEmployee}
          note={employeeNote}
          onNoteChange={handleNoteChange}
          onConfirm={onConfirmMarkLeave}
          onCancel={onCancelMarkLeave}
        />
      </Dialog>
      
      {/* Mark as Available Dialog */}
      <Dialog open={markAvailableDialogOpen} onOpenChange={onCancelMarkAvailable}>
        <EmployeeMarkAvailableDialog
          employee={currentEmployee}
          onConfirmWithNote={onConfirmMarkAvailableWithNote}
          onConfirmWithoutNote={onConfirmMarkAvailableWithoutNote}
          onCancel={onCancelMarkAvailable}
        />
      </Dialog>
    </>
  );
};

export default EmployeeDialogManager;
