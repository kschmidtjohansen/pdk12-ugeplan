
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
    // Set the current car without calling handleEdit recursively
    setCurrentCar(car);
    // Initialize form with car data
    initFormWithCar(car);
    // Open the dialog
    setDialogOpen(true);
    return car;
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
    markCarAvailableDeleteNote
  };
};

export * from './useCarData';
export * from './useCarActions';
export * from './useCarFormState';
