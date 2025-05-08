
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { useEmployeeForm, EmployeeFormData } from './useEmployeeForm';
import { useEmployeeData } from './useEmployeeData';
import { 
  createEmployee as createEmployeeService,
  updateEmployee as updateEmployeeService,
  deleteEmployee as deleteEmployeeService,
  toggleEmployeeLeave as toggleEmployeeLeaveService
} from '@/services/employeeService';

export type { EmployeeFormData } from './useEmployeeForm';

export const useEmployees = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { employees, updateEmployees, isLoading } = useEmployeeData();
  const { 
    currentEmployee, 
    formData, 
    prepareForCreate,
    prepareForEdit,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    setCurrentEmployee
  } = useEmployeeForm();

  const createEmployee = async () => {
    try {
      const newEmployee = await createEmployeeService(formData);
      
      // Add the new employee to the state
      updateEmployees([...employees, newEmployee]);

      toast({
        title: t("employees.employeeAdded"),
        description: t("employees.employeeAddedMsg", {
          name: formData.name
        })
      });

      return newEmployee;
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.createError'),
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEmployee = async () => {
    if (!currentEmployee) return;
    
    try {
      await updateEmployeeService(currentEmployee.id, formData);

      // Update local state
      updateEmployees(employees.map(e => e.id === currentEmployee.id ? {
        ...e,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        role: formData.role,
        onLeave: formData.onLeave,
        notes: formData.notes
      } : e));
      
      toast({
        title: t("employees.employeeUpdated"),
        description: t("employees.employeeUpdatedMsg", {
          name: formData.name
        })
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: "destructive",
      });
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      const employeeToDelete = employees.find(e => e.id === employeeId);
      if (!employeeToDelete) return;
      
      const success = await deleteEmployeeService(employeeId);
      
      if (success) {
        // Update local state
        updateEmployees(employees.filter(e => e.id !== employeeId));
        
        toast({
          title: t("employees.employeeDeleted"),
          description: t("employees.employeeDeletedMsg", { name: employeeToDelete.name })
        });
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.deleteError'),
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeLeave = async (employee: Employee) => {
    try {
      const newLeaveStatus = !employee.onLeave;
      
      const success = await toggleEmployeeLeaveService(employee.id, newLeaveStatus);

      if (success) {
        // Update local state
        updateEmployees(employees.map(e => 
          e.id === employee.id ? {...e, onLeave: newLeaveStatus} : e
        ));
        
        toast({
          title: newLeaveStatus 
            ? t("employees.employeeOnLeave")
            : t("employees.employeeAvailable"),
          description: newLeaveStatus 
            ? t("employees.employeeOnLeaveMsg", { name: employee.name }) 
            : t("employees.employeeAvailableMsg", { name: employee.name })
        });
      }
    } catch (error) {
      console.error('Error toggling employee leave status:', error);
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: "destructive",
      });
    }
  };

  return {
    employees,
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
    isLoading
  };
};
