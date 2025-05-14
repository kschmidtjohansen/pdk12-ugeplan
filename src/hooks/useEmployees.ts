
import { useEmployeeData } from './employee/useEmployeeData';
import { useEmployeeFormState } from './employee/useEmployeeFormState';
import { useEmployeeActions } from './employee/useEmployeeActions';

// Main hook combining all employee-related functionality
export const useEmployees = () => {
  const { employees, loading, error, fetchEmployees } = useEmployeeData();
  
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
    toggleEmployeeLeave: toggleEmployeeLeaveAction
  } = useEmployeeActions(fetchEmployees);

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

  const toggleEmployeeLeave = async (employee: typeof employees[0]) => {
    return await toggleEmployeeLeaveAction(employee, employees);
  };

  return {
    employees,
    loading,
    error,
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
    toggleEmployeeLeave
  };
};
