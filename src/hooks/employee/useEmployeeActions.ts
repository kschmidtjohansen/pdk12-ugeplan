import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';
import { safeProperty } from '@/utils/dbHelpers';
import { isValidUUID, validateUUID, safeUUID } from '@/utils/uuidValidation';

export const useEmployeeActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();

  /**
   * Update employee onLeave status
   */
  const toggleEmployeeLeave = async (employee: any, setOnLeave: boolean, notes: string | null = null) => {
    // Validate employee ID
    if (!employee?.id || !isValidUUID(employee.id)) {
      console.error('Invalid employee ID provided:', employee?.id);
      toast({
        title: t('common.error'),
        description: 'Invalid employee ID',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Update the onLeave status and optionally update notes
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          on_leave: setOnLeave,
          notes: notes || null
        })
        .eq('id', employee.id)
        .select();
      
      if (error) throw error;
      
      // Show toast notification
      toast({
        title: setOnLeave 
          ? t('employees.employeeOnLeave') 
          : t('employees.employeeAvailable'),
        description: setOnLeave 
          ? t('employees.employeeOnLeaveMsg', { name: employee.name }) 
          : t('employees.employeeAvailableMsg', { name: employee.name })
      });
      
      // Refresh the employees list after toggle
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error toggling employee leave status:', err);
      
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  /**
   * SIMPLIFIED: This function no longer automatically marks employees as on leave based on vacations
   * Manual leave status is now separate from vacation-based availability
   */
  const updateEmployeeLeaveStatusFromVacations = async () => {
    console.log('updateEmployeeLeaveStatusFromVacations: This function is now simplified and only refreshes employee data');
    
    try {
      // Just refresh the employee list to get the latest data
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('Error refreshing employee data:', err);
      return false;
    }
  };

  /**
   * Create a new employee
   */
  const createEmployee = async (formData: any) => {
    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Email, password, and name are required');
      }

      // Call the admin-create-user function to create a new user
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role || 'servicemedarbejder'
        }
      });
      
      if (error) throw error;
      
      if (data.error) {
        console.error('Function error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('Employee created:', data);
      
      // Update the profile with additional fields if we have a valid ID
      if (data.id && isValidUUID(data.id)) {
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
      } else {
        console.warn('Invalid or missing user ID returned from creation:', data.id);
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
    if (!isValidUUID(employee?.id)) {
      console.error('Invalid employee ID for update:', employee?.id);
      toast({
        title: t('common.error'),
        description: 'Invalid employee ID',
        variant: 'destructive',
      });
      return false;
    }
    
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
    if (!isValidUUID(employeeId)) {
      console.error('Invalid employee ID for deletion:', employeeId);
      toast({
        title: t('common.error'),
        description: 'Invalid employee ID',
        variant: 'destructive',
      });
      return false;
    }
    
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
    toggleEmployeeLeave,
    updateEmployeeLeaveStatusFromVacations
  };
};
