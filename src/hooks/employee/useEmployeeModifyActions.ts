
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle employee creation, update, and deletion actions
 */
export const useEmployeeModifyActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  /**
   * Create a new employee
   */
  const createEmployee = async (formData: any) => {
    try {
      // Call the admin-create-user function to create a new user
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        }
      });
      
      if (error) throw error;
      
      if (data.error) {
        console.error('Function error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('Employee created:', data);
      
      // Update the profile with additional fields
      if (data.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone || null,
            job_title: formData.jobTitle || null,
            on_leave: formData.onLeave || false,
            notes: formData.notes || null
          })
          .eq('id', data.id);
        
        if (profileError) {
          console.error('Error updating profile:', profileError);
          throw profileError;
        }
      }
      
      toast({
        title: t('employees.employeeAdded'),
        description: t('employees.employeeAddedMsg', { name: formData.name })
      });
      
      // Refresh the employees list
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error creating employee:', err);
      
      // Show error toast with specific message if available
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to create employee',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  /**
   * Update an existing employee
   */
  const updateEmployee = async (employee: any, formData: any) => {
    if (!employee?.id) return false;
    
    try {
      // Update the profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          job_title: formData.jobTitle || null,
          on_leave: formData.onLeave || false,
          notes: formData.notes || null
        })
        .eq('id', employee.id);
      
      if (profileError) throw profileError;
      
      // Update the user role if it changed
      if (employee.role !== formData.role) {
        const { error: roleError } = await supabase.functions.invoke('admin-user-role', {
          body: {
            userId: employee.id,
            role: formData.role
          }
        });
        
        if (roleError) throw roleError;
      }
      
      toast({
        title: t('employees.employeeUpdated'),
        description: t('employees.employeeUpdatedMsg', { name: formData.name })
      });
      
      // Refresh the employees list
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error updating employee:', err);
      
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('employees.updateError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  /**
   * Delete an employee
   */
  const deleteEmployee = async (employeeId: string, allEmployees: any[]) => {
    if (!employeeId) return false;
    
    try {
      // Find employee name before deletion
      const employee = allEmployees.find(e => e.id === employeeId);
      if (!employee) throw new Error('Employee not found');
      
      // Delete the user through the admin function
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: {
          userId: employeeId
        }
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: t('employees.employeeDeleted'),
        description: t('employees.employeeDeletedMsg', { name: employee.name })
      });
      
      // Refresh the employees list
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error deleting employee:', err);
      
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('employees.deleteError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
