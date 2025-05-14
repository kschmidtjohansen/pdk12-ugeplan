
import { useVacationData } from './vacation/useVacationData';
import { useVacationFormState } from './vacation/useVacationFormState';
import { useVacationActions } from './vacation/useVacationActions';
import { useEmployees } from './useEmployees';
import { Vacation } from '@/types/vacation';
import { useState } from 'react';

export const useVacations = () => {
  const { vacations, loading, error, fetchVacations } = useVacationData();
  
  const {
    date,
    setDate,
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
  
  const { employees } = useEmployees();
  
  // Add states for edit and delete dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  
  const {
    submitVacationRequest: submitRequest,
    approveVacation,
    rejectVacation,
    editVacation,
    deleteVacation
  } = useVacationActions(fetchVacations);

  // Wrapper function to simplify the submit vacation request call
  const submitVacationRequest = async (e: React.FormEvent, isAdminRequest: boolean = false) => {
    const result = await submitRequest(
      e, 
      date, 
      reason, 
      isAdminRequest, 
      selectedEmployeeId, 
      employees
    );
    
    if (result) {
      // Reset form state on successful submission
      resetFormState();
    }
    
    return result;
  };
  
  // Edit vacation handler
  const handleEditVacation = (vacation: Vacation) => {
    setSelectedVacation(vacation);
    setDate({
      from: vacation.startDate,
      to: vacation.endDate,
    });
    setReason(vacation.reason);
    setEditDialogOpen(true);
  };
  
  // Submit edit handler
  const submitEditVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacation || !date.from || !date.to) return;
    
    await editVacation(
      selectedVacation,
      date.from,
      date.to,
      reason
    );
    
    setEditDialogOpen(false);
    resetFormState();
    setSelectedVacation(null);
  };
  
  // Delete vacation handler
  const handleDeleteVacation = (vacation: Vacation) => {
    console.log("Setting up vacation for deletion:", vacation.id);
    setSelectedVacation(vacation);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete handler - this function calls the deleteVacation function
  const confirmDeleteVacation = async () => {
    if (!selectedVacation) {
      console.error("No vacation selected for deletion");
      return;
    }
    
    console.log("Confirming deletion of vacation:", selectedVacation.id);
    
    try {
      // Call the deleteVacation function from useVacationActions
      const success = await deleteVacation(selectedVacation);
      
      if (success) {
        console.log("Vacation successfully deleted:", selectedVacation.id);
        
        // Close the dialog and reset state
        setDeleteDialogOpen(false);
        setSelectedVacation(null);
      } else {
        console.error("Failed to delete vacation");
      }
    } catch (err) {
      console.error("Error in confirmDeleteVacation:", err);
    }
  };

  // Handle delete for the current vacation (from the edit dialog)
  const handleDeleteCurrentVacation = () => {
    if (selectedVacation) {
      setDeleteDialogOpen(true);
      setEditDialogOpen(false);
    }
  };

  return {
    vacations,
    loading,
    error,
    date,
    setDate,
    reason,
    setReason,
    note,
    setNote,
    dialogOpen,
    setDialogOpen,
    adminDialogOpen,
    setAdminDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedVacation,
    selectedEmployeeId,
    setSelectedEmployeeId,
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    handleEditVacation,
    submitEditVacation,
    handleDeleteVacation,
    confirmDeleteVacation,
    handleDeleteCurrentVacation
  };
};
