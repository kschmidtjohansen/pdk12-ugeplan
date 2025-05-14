
import { useVacationData } from './useVacationData';
import { useVacationFormState } from './useVacationFormState';
import { useVacationEditState } from './useVacationEditState';
import { useVacationDeleteState } from './useVacationDeleteState';
import { useVacationActions } from './useVacationActions';
import { useVacationRequests } from './useVacationRequests';
import { useState } from 'react';
import { Vacation } from '@/types/vacation';

/**
 * Core vacation hook that coordinates all vacation-related functionality
 */
export const useVacationCore = () => {
  const { vacations, loading, error, fetchVacations } = useVacationData();
  
  const {
    date,
    setDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason,
    setReason,
    note,
    setNote,
    selectedEmployeeId,
    setSelectedEmployeeId,
    adminDialogOpen,
    setAdminDialogOpen,
    dialogOpen,
    setDialogOpen,
    resetFormState
  } = useVacationFormState();

  const {
    editDialogOpen,
    setEditDialogOpen,
    selectedVacation,
    setSelectedVacation,
    prepareVacationForEdit,
    submitEditVacation
  } = useVacationEditState({
    vacations,
    fetchVacations, 
    date, 
    setDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason, 
    setReason,
    resetFormState
  });
  
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteVacation,
    confirmDeleteVacation,
    handleDeleteCurrentVacation
  } = useVacationDeleteState({
    fetchVacations,
    selectedVacation,
    setSelectedVacation, 
    setEditDialogOpen
  });
  
  const {
    approveVacation,
    rejectVacation,
  } = useVacationActions(fetchVacations);

  // Get vacation request functionality
  const { submitVacationRequest } = useVacationRequests();

  return {
    // Data
    vacations,
    loading,
    error,
    fetchVacations,
    
    // Form state
    date,
    setDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason,
    setReason,
    note,
    setNote,
    selectedEmployeeId,
    setSelectedEmployeeId,
    
    // Dialog state
    adminDialogOpen,
    setAdminDialogOpen,
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    
    // Vacation state
    selectedVacation,
    setSelectedVacation,
    
    // Core actions
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    
    // Edit actions
    prepareVacationForEdit,
    submitEditVacation,
    
    // Delete actions
    handleDeleteVacation,
    confirmDeleteVacation,
    handleDeleteCurrentVacation,
    
    // State reset
    resetFormState
  };
};
