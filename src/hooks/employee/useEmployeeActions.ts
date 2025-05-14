
import { useEmployeeModifyActions } from './useEmployeeModifyActions';
import { useEmployeeLeaveActions } from './useEmployeeLeaveActions';
import { useEmployeeVacationSync } from './useEmployeeVacationSync';

/**
 * Main hook for all employee actions, combining specialized action hooks
 */
export const useEmployeeActions = (refreshEmployees: () => Promise<void>) => {
  const { 
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
  } = useEmployeeModifyActions(refreshEmployees);
  
  const { 
    toggleEmployeeLeave 
  } = useEmployeeLeaveActions(refreshEmployees);
  
  const {
    updateEmployeeLeaveStatusFromVacations
  } = useEmployeeVacationSync(refreshEmployees);

  return {
    // Employee CRUD operations
    createEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Employee leave actions
    toggleEmployeeLeave,
    
    // Vacation synchronization
    updateEmployeeLeaveStatusFromVacations
  };
};
