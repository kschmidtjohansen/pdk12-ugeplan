
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
  
  const { employees } = useEmployees();
  
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

  // Add denyVacation as alias for rejectVacation
  const denyVacation = rejectVacation;

  const submitVacationRequest = async (e: React.FormEvent, isAdminRequest: boolean = false) => {
    e.preventDefault();
    
    const requestStartDate = startDate || date.from;
    const requestEndDate = endDate || date.to;
    
    if (!requestStartDate || !requestEndDate) {
      return false;
    }
    
    const result = await submitRequest(
      e, 
      { from: requestStartDate, to: requestEndDate }, 
      reason, 
      isAdminRequest, 
      selectedEmployeeId, 
      employees
    );
    
    if (result) {
      resetFormState();
    }
    
    return result;
  };
  
  const handleEditVacation = (vacation: Vacation) => {
    console.log("Setting up vacation for editing:", vacation);
    setSelectedVacation(vacation);
    
    setDate({ from: undefined, to: undefined });
    setStartDate(undefined);
    setEndDate(undefined);
    
    const vacationStartDate = new Date(vacation.startDate);
    const vacationEndDate = new Date(vacation.endDate);
    
    setDate({
      from: vacationStartDate,
      to: vacationEndDate,
    });
    
    setStartDate(vacationStartDate);
    setEndDate(vacationEndDate);
    setReason(vacation.reason);
    setEditDialogOpen(true);
  };
  
  const submitEditVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacation) return;
    
    const editStartDate = startDate || date.from;
    const editEndDate = endDate || date.to;
    
    if (!editStartDate || !editEndDate) {
      console.error("Missing start or end date when trying to edit vacation");
      return;
    }

    const startDateObj = editStartDate instanceof Date ? 
      editStartDate : new Date(editStartDate);
    
    const endDateObj = editEndDate instanceof Date ? 
      editEndDate : new Date(editEndDate);
    
    await editVacation(
      selectedVacation,
      startDateObj,
      endDateObj,
      reason
    );
    
    setEditDialogOpen(false);
    resetFormState();
    setSelectedVacation(null);
  };
  
  const handleDeleteVacation = (vacation: Vacation) => {
    console.log("Setting up vacation for deletion:", vacation.id);
    setSelectedVacation(vacation);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteVacation = async () => {
    if (!selectedVacation) {
      console.error("No vacation selected for deletion");
      return;
    }
    
    try {
      const success = await deleteVacation(selectedVacation);
      
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedVacation(null);
        fetchVacations();
      } else {
        console.error("Failed to delete vacation");
      }
    } catch (err) {
      console.error("Error in confirmDeleteVacation:", err);
    }
  };

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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
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
    denyVacation,
    handleEditVacation,
    submitEditVacation,
    handleDeleteVacation,
    confirmDeleteVacation,
    handleDeleteCurrentVacation
  };
};
