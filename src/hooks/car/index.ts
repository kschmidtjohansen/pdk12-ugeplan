
import { useState } from 'react';
import { useCarData } from './useCarData';
import { useCarActions } from './useCarActions';
import { useCarFormState } from './useCarFormState';
import { CarData } from '@/components/Cars/types';

export const useCars = () => {
  const { cars, setCars, loading, error, fetchCars } = useCarData();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  const {
    currentCar,
    setCurrentCar,
    deleteDialogOpen,
    setDeleteDialogOpen,
    unavailableDialogOpen,
    setUnavailableDialogOpen,
    availableDialogOpen,
    setAvailableDialogOpen,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleToggleAvailability,
    markCarUnavailable,
    markCarAvailableKeepNote,
    markCarAvailableDeleteNote
  } = useCarActions(cars, setCars);

  const {
    formData,
    handleCreateNew,
    initFormWithCar,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit
  } = useCarFormState({ 
    cars, 
    setCars, 
    currentCar, 
    setCurrentCar, 
    setDialogOpen 
  });

  // Enhanced handleEdit to initialize form data
  const enhancedHandleEdit = (car: CarData) => {
    setCurrentCar(car);
    initFormWithCar(car);
    setDialogOpen(true);
    return car;
  };

  // Car management functions for admin
  const createCar = () => {
    handleCreateNew();
    setDialogOpen(true);
  };

  const updateCar = () => {
    if (currentCar) {
      return handleSubmit();
    }
    return Promise.resolve(false);
  };

  const deleteCar = () => {
    if (currentCar) {
      return confirmDelete();
    }
    return Promise.resolve(false);
  };

  return {
    cars,
    loading,
    error,
    currentCar,
    formData,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    unavailableDialogOpen,
    setUnavailableDialogOpen,
    availableDialogOpen,
    setAvailableDialogOpen,
    handleCreateNew,
    handleEdit: enhancedHandleEdit,
    handleDelete,
    confirmDelete,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit,
    fetchCars,
    handleToggleAvailability,
    markCarUnavailable,
    markCarAvailableKeepNote,
    markCarAvailableDeleteNote,
    createCar,
    updateCar,
    deleteCar
  };
};

export * from './useCarData';
export * from './useCarActions';
export * from './useCarFormState';
