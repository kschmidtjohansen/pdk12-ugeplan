
import React, { Suspense, lazy } from 'react';
const CarFormDialog = lazy(() => import('./CarFormDialog'));
const DeleteConfirmDialog = lazy(() => import('./DeleteConfirmDialog'));
import { CarData, CarFormData } from './types';

interface CarDialogsProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  formData: CarFormData;
  setFormData?: React.Dispatch<React.SetStateAction<CarFormData>>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  currentCar: CarData | null;
  canViewFuelCardCode: boolean;
  onConfirmDelete: (forceDelete?: boolean) => void;
  cars?: CarData[];
}

const CarDialogs: React.FC<CarDialogsProps> = ({
  dialogOpen,
  setDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  formData,
  setFormData,
  onInputChange,
  onCheckboxChange,
  onSubmit,
  currentCar,
  canViewFuelCardCode,
  onConfirmDelete,
  cars = []
}) => {
  return (
    <>
      <CarFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
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
