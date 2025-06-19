
import { useEmployeeDataOptimized } from './employee/useEmployeeDataOptimized';
import { useEmployeeFormState } from './employee/useEmployeeFormState';
import { useEmployeeActionsOptimized } from './employee/useEmployeeActionsOptimized';

// Main hook combining all employee-related functionality - now using optimized versions
export const useEmployees = () => {
  const { employees, loading, error, fetchEmployees } = useEmployeeDataOptimized();
  
  const {
    currentEmployee,
    formData,
    prepareForCreate,
    prepareForEdit,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange
  } = useEmployeeFormState();
  
  const {
    createEmployee: createEmployeeAction,
    updateEmployee: updateEmployeeAction,
    deleteEmployee: deleteEmployeeAction,
    toggleEmployeeLeave: toggleEmployeeLeaveAction,
    updateEmployeeLeaveStatusFromVacations
  } = useEmployeeActionsOptimized(fetchEmployees);

  // Wrapper functions that use the current state from useEmployeeFormState
  const createEmployee = async () => {
    return await createEmployeeAction(formData);
  };

  const updateEmployee = async () => {
    if (currentEmployee) {
      return await updateEmployeeAction(currentEmployee, formData);
    }
    return false;
  };

  const deleteEmployee = async (employeeId: string) => {
    return await deleteEmployeeAction(employeeId, employees);
  };

  const toggleEmployeeLeave = async (employee: typeof employees[0], setOnLeave: boolean, notes: string | null = null) => {
    return await toggleEmployeeLeaveAction(employee, setOnLeave, notes);
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    currentEmployee,
    formData,
    prepareForCreate,
    prepareForEdit,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave,
    updateEmployeeLeaveStatusFromVacations
  };
};
