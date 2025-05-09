
import { useVacationData } from './vacation/useVacationData';
import { useVacationFormState } from './vacation/useVacationFormState';
import { useVacationActions } from './vacation/useVacationActions';
import { useEmployees } from './useEmployees';
import { Vacation } from '@/types/vacation';

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
  
  const {
    submitVacationRequest: submitRequest,
    approveVacation,
    rejectVacation
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
    selectedEmployeeId,
    setSelectedEmployeeId,
    submitVacationRequest,
    approveVacation,
    rejectVacation
  };
};
