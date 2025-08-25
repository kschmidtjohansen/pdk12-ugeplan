
import { useEmployeeData } from './employee/useEmployeeData';
import { useEmployeeFormState } from './employee/useEmployeeFormState';
import { useEmployeeActions } from './employee/useEmployeeActions';

// Main hook combining all employee-related functionality - now streamlined
export const useEmployees = () => {
  const { employees, loading, error, fetchEmployees } = useEmployeeData();
  
  const formState = useEmployeeFormState();
  
  const {
    createEmployee: createEmployeeAction,
    updateEmployee: updateEmployeeAction,
    deleteEmployee: deleteEmployeeAction,
    toggleEmployeeLeave: toggleEmployeeLeaveAction
  } = useEmployeeActions(fetchEmployees);

  // Wrapper functions that use the current state from useEmployeeFormState
  const createEmployee = async () => {
    return await createEmployeeAction(formState.formData);
  };

  const updateEmployee = async () => {
    if (formState.currentEmployee) {
      return await updateEmployeeAction(formState.currentEmployee, formState.formData);
    }
    return false;
  };

  const deleteEmployee = async (employeeId: string) => {
    return await deleteEmployeeAction(employeeId, employees);
  };

  const toggleEmployeeLeave = async (employee: typeof employees[0], setOnLeave: boolean, notes: string | null = null) => {
    return await toggleEmployeeLeaveAction(employee, setOnLeave, notes);
  };

  // Separate regular employees from vikarer
  const regularEmployees = employees.filter(emp => emp.role !== 'vikar');
  const vikarer = employees.filter(emp => emp.role === 'vikar');

  console.log(`[useEmployees] Providing ${employees.length} employees (${regularEmployees.length} regular, ${vikarer.length} vikarer)`);

  return {
    employees,
    regularEmployees,
    vikarer,
    loading,
    error,
    fetchEmployees,
    currentEmployee: formState.currentEmployee,
    formData: formState.formData,
    prepareForCreate: formState.prepareForCreate,
    prepareForEdit: formState.prepareForEdit,
    prepareForCreateVikar: formState.prepareForCreateVikar,
    handleInputChange: formState.handleInputChange,
    handleSelectChange: formState.handleSelectChange,
    handleCheckboxChange: formState.handleCheckboxChange,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave
  };
};
