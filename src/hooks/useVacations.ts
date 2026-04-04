import { useVacationData } from './vacation/useVacationData';
import { useVacationFormState } from './vacation/useVacationFormState';
import { useVacationActions } from './vacation/useVacationActions';
import { useVacationSecurity } from './vacation/useVacationSecurity';
import { useEmployees } from './useEmployees';
import { Vacation } from '@/types/vacation';
import { useState } from 'react';

export const useVacations = () => {
  const { vacations, loading, error, fetchVacations } = useVacationData();
  
  const {
    date,
    setDate,
    // New separate date fields
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
    // New request type and time fields
    requestType,
    setRequestType,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
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

  // Import security functions
  const { 
    canViewVacation, 
    canEditVacation, 
    canDeleteVacation, 
    logVacationSecurityEvent 
  } = useVacationSecurity();

  // Enhanced wrapper function with security logging
  const submitVacationRequest = async (e: React.FormEvent, isAdminRequest: boolean = false) => {
    e.preventDefault();
    
    // Check if we have both dates from either the combined or separate date fields
    const requestStartDate = startDate || date.from;
    const requestEndDate = endDate || date.to;
    
    // FIXED: Changed from || to && to properly validate both dates are present
    if (!requestStartDate || !requestEndDate) {
      return false;
    }
    
    const result = await submitRequest(
      { 
        dateRange: { from: requestStartDate, to: requestEndDate },
        requestType,
        startTime: requestType === 'partial_day' ? startTime : undefined,
        endTime: requestType === 'partial_day' ? endTime : undefined,
        reason
      }, 
      isAdminRequest, 
      selectedEmployeeId, 
      employees
    );
    
    if (result) {
      // Reset form state on successful submission
      resetFormState();
      
      // Log successful form submission
      await logVacationSecurityEvent('form_submitted', 'new_request', {
        is_admin_request: isAdminRequest,
        request_type: requestType
      });
    }
    
    return result;
  };
  
  // Enhanced handler for editing a vacation with security checks
  const handleEditVacation = (vacation: Vacation) => {
    // Security check before allowing edit
    if (!canEditVacation(vacation)) {
      if (import.meta.env.DEV) console.warn('User attempted to edit vacation without permission:', vacation.id);
      return;
    }

    if (import.meta.env.DEV) console.log("Setting up vacation for editing:", vacation);
    setSelectedVacation(vacation);
    
    // Clear existing date values first
    setDate({ from: undefined, to: undefined });
    setStartDate(undefined);
    setEndDate(undefined);
    
    // Then set the new values
    // Convert string dates to Date objects
    const vacationStartDate = new Date(vacation.start_date);
    const vacationEndDate = new Date(vacation.end_date);
    
    if (import.meta.env.DEV) console.log("Setting dates for editing:", {
      startDate: vacationStartDate.toISOString(),
      endDate: vacationEndDate.toISOString()
    });
    
    // Set both the date range and individual date fields
    setDate({
      from: vacationStartDate,
      to: vacationEndDate,
    });
    
    setStartDate(vacationStartDate);
    setEndDate(vacationEndDate);
    setReason(vacation.reason || '');
    
    // Set request type and times if available
    setRequestType(vacation.request_type || 'full_day');
    setStartTime(vacation.start_time || '');
    setEndTime(vacation.end_time || '');
    
    setEditDialogOpen(true);
  };
  
  // Enhanced submit edit handler with security validation
  const submitEditVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacation) return;
    
    // Security check before submitting edit
    if (!canEditVacation(selectedVacation)) {
      if (import.meta.env.DEV) console.warn('User attempted to submit edit for vacation without permission:', selectedVacation.id);
      return;
    }
    
    // Use either the individual dates or the combined date range
    const editStartDate = startDate || date.from;
    const editEndDate = endDate || date.to;
    
    if (!editStartDate || !editEndDate) {
      if (import.meta.env.DEV) console.error("Missing start or end date when trying to edit vacation");
      return;
    }

    // Ensure we're working with Date objects
    const startDateObj = editStartDate instanceof Date ? 
      editStartDate : new Date(editStartDate);
    
    const endDateObj = editEndDate instanceof Date ? 
      editEndDate : new Date(editEndDate);
    
    if (import.meta.env.DEV) console.log("Submitting edit with dates and request type:", {
      startDate: startDateObj instanceof Date ? startDateObj.toISOString() : "undefined",
      endDate: endDateObj instanceof Date ? endDateObj.toISOString() : "undefined",
      requestType,
      startTime,
      endTime
    });
    
    const success = await editVacation(
      selectedVacation,
      startDateObj,
      endDateObj,
      reason,
      requestType,
      requestType === 'partial_day' ? startTime : undefined,
      requestType === 'partial_day' ? endTime : undefined
    );
    
    if (success) {
      setEditDialogOpen(false);
      resetFormState();
      setSelectedVacation(null);
    }
  };
  
  // Enhanced delete vacation handler with security checks
  const handleDeleteVacation = (vacation: Vacation) => {
    // Security check before allowing delete
    if (!canDeleteVacation(vacation)) {
      if (import.meta.env.DEV) console.warn('User attempted to delete vacation without permission:', vacation.id);
      return;
    }

    if (import.meta.env.DEV) console.log("Setting up vacation for deletion:", vacation.id);
    setSelectedVacation(vacation);
    setDeleteDialogOpen(true);
  };
  
  // Enhanced confirm delete handler with security validation
  const confirmDeleteVacation = async () => {
    if (!selectedVacation) {
      if (import.meta.env.DEV) console.error("No vacation selected for deletion");
      return;
    }
    
    // Security check before confirming delete
    if (!canDeleteVacation(selectedVacation)) {
      if (import.meta.env.DEV) console.warn('User attempted to confirm delete for vacation without permission:', selectedVacation.id);
      return;
    }
    
    if (import.meta.env.DEV) console.log("Confirming deletion of vacation:", selectedVacation.id);
    
    try {
      const success = await deleteVacation(selectedVacation);
      
      if (success) {
        if (import.meta.env.DEV) console.log("Vacation successfully deleted:", selectedVacation.id);
        
        // Close the dialog and reset state
        setDeleteDialogOpen(false);
        setSelectedVacation(null);

        // The fetchVacations call is already handled in the deleteVacation function
      } else {
        if (import.meta.env.DEV) console.error("Failed to delete vacation");
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error in confirmDeleteVacation:", err);
    }
  };

  // Handle delete for the current vacation (from the edit dialog)
  const handleDeleteCurrentVacation = () => {
    if (selectedVacation && canDeleteVacation(selectedVacation)) {
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
    // Add separate date fields
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason,
    setReason,
    note,
    setNote,
    // Add request type and time fields
    requestType,
    setRequestType,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
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
    handleDeleteCurrentVacation,
    // Export security functions for components that need them
    canViewVacation,
    canEditVacation,
    canDeleteVacation
  };
};
