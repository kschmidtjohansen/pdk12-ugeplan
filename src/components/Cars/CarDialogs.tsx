
import React from 'react';
import CarFormDialog from './CarFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { CarData, CarFormData } from './types';

interface CarDialogsProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  formData: CarFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  currentCar: CarData | null;
  canViewFuelCardCode: boolean;
  onConfirmDelete: () => void;
}

const CarDialogs: React.FC<CarDialogsProps> = ({
  dialogOpen,
  setDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  formData,
  onInputChange,
  onCheckboxChange,
  onSubmit,
  currentCar,
  canViewFuelCardCode,
  onConfirmDelete
}) => {
  return (
    <>
      <CarFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        onInputChange={onInputChange}
        onCheckboxChange={onCheckboxChange}
        onSubmit={onSubmit}
        isEditing={!!currentCar}
        canViewFuelCardCode={canViewFuelCardCode}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        currentCar={currentCar}
        onConfirmDelete={onConfirmDelete}
      />
    </>
  );
};

export default CarDialogs;
