
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';
import { isValidUUID } from '@/utils/uuidValidation';

export const useEmployeeActionsOptimized = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();

  // Optimized employee leave toggle with better error handling
  const toggleEmployeeLeave = async (employee: any, setOnLeave: boolean, notes: string | null = null) => {
    if (!employee?.id || !isValidUUID(employee.id)) {
      console.error('[useEmployeeActionsOptimized] Invalid employee ID:', employee?.id);
      toast({
        title: t('common.error'),
        description: 'Invalid employee ID',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      console.log('[useEmployeeActionsOptimized] Updating employee leave status:', {
        employeeId: employee.id,
        onLeave: setOnLeave,
        hasNotes: !!notes
      });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          on_leave: setOnLeave,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id)
        .select('id, name, on_leave');
      
      if (error) {
        console.error('[useEmployeeActionsOptimized] Update error:', error);
        throw error;
      }
      
      console.log('[useEmployeeActionsOptimized] Successfully updated employee:', data);
      
      toast({
        title: setOnLeave 
          ? t('employees.employeeOnLeave') 
          : t('employees.employeeAvailable'),
        description: setOnLeave 
          ? t('employees.employeeOnLeaveMsg', { name: employee.name }) 
          : t('employees.employeeAvailableMsg', { name: employee.name })
      });
      
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('[useEmployeeActionsOptimized] Error:', err);
      
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Optimized employee creation with transaction-like behavior
  const createEmployee = async (formData: any) => {
    try {
      // Enhanced validation
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Email, password, and name are required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please provide a valid email address');
      }

      console.log('[useEmployeeActionsOptimized] Creating employee with optimized flow:', {
        email: formData.email,
        name: formData.name,
        role: formData.role || 'servicemedarbejder'
      });

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role || 'servicemedarbejder'
        }
      });
      
      if (error) {
        console.error('[useEmployeeActionsOptimized] Function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('[useEmployeeActionsOptimized] Function returned error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('[useEmployeeActionsOptimized] Employee created successfully:', data?.id);
      
      // Update profile with additional fields if we have a valid ID
      if (data?.id && isValidUUID(data.id)) {
        console.log('[useEmployeeActionsOptimized] Updating profile with additional data');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone || null,
            job_title: formData.jobTitle || null,
            on_leave: formData.onLeave || false,
            notes: formData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
        
        if (profileError) {
          console.warn('[useEmployeeActionsOptimized] Profile update warning:', profileError);
          // Don't fail the entire operation for profile updates
        }
      }
      
      toast({
        title: t('employees.employeeAdded'),
        description: t('employees.employeeAddedMsg', { 
          name: formData.name, 
          role: formData.role || 'servicemedarbejder'
        })
      });
      
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('[useEmployeeActionsOptimized] Creation error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Optimized employee update with better validation
  const updateEmployee = async (employee: any, formData: any) => {
    if (!isValidUUID(employee?.id)) {
      console.error('[useEmployeeActionsOptimized] Invalid employee ID for update:', employee?.id);
      toast({
        title: t('common.error'),
        description: 'Invalid employee ID',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error('Please provide a valid email address');
        }
      }

      console.log('[useEmployeeActionsOptimized] Updating employee with optimized flow:', {
        employeeId: employee.id,
        roleChange: employee.role !== formData.role
      });
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          job_title: formData.jobTitle || null,
          on_leave: formData.onLeave || false,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);
      
      if (profileError) {
        console.error('[useEmployeeActionsOptimized] Profile update error:', profileError);
        throw profileError;
      }
      
      // Handle role update if changed
      if (employee.role !== formData.role) {
        console.log('[useEmployeeActionsOptimized] Updating role via function');
        
        const { error: roleError } = await supabase.functions.invoke('admin-user-role', {
          body: {
            userId: employee.id,
            role: formData.role
          }
        });
        
        if (roleError) {
          console.error('[useEmployeeActionsOptimized] Role update error:', roleError);
          throw roleError;
        }
      }
      
      toast({
        title: t('employees.employeeUpdated'),
        description: t('employees.employeeUpdateMsg', { name: formData.name })
      });
      
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('[useEmployeeActionsOptimized] Update error:', err);
      
      const errorMessage = err instanceof Error ? err.message : t('employees.updateError');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Optimized employee deletion with enhanced error handling
  const deleteEmployee = async (employeeId: string, allEmployees: any[]) => {
    if (!isValidUUID(employeeId)) {
      console.error('[useEmployeeActionsOptimized] Invalid employee ID for deletion:', employeeId);
      toast({
        title: t('common.error'),
        description: 'Invalid employee ID',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      const employee = allEmployees.find(e => e.id === employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      console.log('[useEmployeeActionsOptimized] Deleting employee with enhanced error handling:', {
        employeeId,
        employeeName: employee.name
      });
      
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: { userId: employeeId }
      });
      
      if (error) {
        console.error('[useEmployeeActionsOptimized] Delete function error:', error);
        
        // Enhanced error message handling
        if (error.message?.includes('Failed to send a request')) {
          throw new Error('Network error: Unable to connect to the server. Please try again.');
        } else if (error.message?.includes('Not authenticated')) {
          throw new Error('Authentication error: Please refresh and try again.');
        } else if (error.message?.includes('Unauthorized')) {
          throw new Error('Permission denied: You cannot delete users.');
        }
        
        throw new Error(`Server error: ${error.message}`);
      }
      
      if (data?.error) {
        console.error('[useEmployeeActionsOptimized] Function returned error:', data.error);
        
        if (data.error.includes('Cannot delete user: User is still assigned')) {
          throw new Error('Cannot delete: Employee is assigned to active assignments. Please reassign them first.');
        }
        
        throw new Error(data.error);
      }
      
      console.log('[useEmployeeActionsOptimized] Employee deleted successfully');
      
      toast({
        title: t('employees.employeeDeleted'),
        description: t('employees.employeeDeletedMsg', { name: employee.name })
      });
      
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('[useEmployeeActionsOptimized] Delete error:', err);
      
      const errorMessage = err instanceof Error ? err.message : t('employees.deleteError');
      toast({
        title: t('common.error'),
        description: errorMessage,
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
    updateEmployeeLeaveStatusFromVacations: async () => {
      console.log('[useEmployeeActionsOptimized] Refreshing employee data');
      await refreshEmployees();
      return true;
    }
  };
};
