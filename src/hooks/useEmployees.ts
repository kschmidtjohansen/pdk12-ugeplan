
import { useEmployeeData } from './employee/useEmployeeData';
import { useEmployeeFormState } from './employee/useEmployeeFormState';
import { useEmployeeActions } from './employee/useEmployeeActions';
import { useEmployeeCreation } from './employee/useEmployeeCreation';
import { notifyOwnAction } from '@/lib/realtimeUtils';

export const useEmployees = () => {
  const { employees, loading, error, fetchEmployees } = useEmployeeData();
  
  const formState = useEmployeeFormState();
  
  const {
    updateEmployee: updateEmployeeAction,
    deleteEmployee: deleteEmployeeAction,
    toggleEmployeeLeave: toggleEmployeeLeaveAction
  } = useEmployeeActions(fetchEmployees);

  const { createEmployee: createEmployeeFromCreationHook } = useEmployeeCreation(fetchEmployees);

  const createEmployee = async () => {
    notifyOwnAction();
    return await createEmployeeFromCreationHook(formState.formData);
  };

  const updateEmployee = async () => {
    notifyOwnAction();
    if (formState.currentEmployee) {
      return await updateEmployeeAction(formState.currentEmployee, formState.formData);
    }
    return false;
  };

  const deleteEmployee = async (employeeId: string) => {
    notifyOwnAction();
    return await deleteEmployeeAction(employeeId, employees);
  };

  const toggleEmployeeLeave = async (employee: typeof employees[0], setOnLeave: boolean, notes: string | null = null) => {
    notifyOwnAction();
    return await toggleEmployeeLeaveAction(employee, setOnLeave, notes);
  };

  const regularEmployees = employees.filter(emp => emp.role !== 'vikar');
  const vikarer = employees.filter(emp => emp.role === 'vikar');

  if (import.meta.env.DEV) {
    console.log(`[useEmployees] Providing ${employees.length} employees (${regularEmployees.length} regular, ${vikarer.length} vikarer)`);
  }

  return {
    employees,
    regularEmployees,
    vikarer,
    loading,
    error,
    fetchEmployees,
    currentEmployee: formState.currentEmployee,
    formData: formState.formData,
    creationType: formState.creationType,
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
