
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';

export const useEmployeeActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const toggleEmployeeLeave = async (employee: Employee, setOnLeave: boolean, notes: string | null = null) => {
    try {
      console.log('[useEmployeeActions] Updating employee leave status:', {
        employeeId: employee.id,
        onLeave: setOnLeave
      });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          on_leave: setOnLeave,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);
      
      if (error) throw error;
      
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
      console.error('[useEmployeeActions] Error:', err);
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const createEmployee = async (formData: any) => {
    try {
      console.log('[useEmployeeActions] Starting employee creation with form data:', formData);
      
      if (!formData.email || !formData.password || !formData.name) {
        const missingFields = [];
        if (!formData.email) missingFields.push('email');
        if (!formData.password) missingFields.push('password');
        if (!formData.name) missingFields.push('name');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('[useEmployeeActions] Creating employee:', {
        email: formData.email,
        name: formData.name,
        role: formData.role || 'servicemedarbejder',
        phone: formData.phone,
        jobTitle: formData.jobTitle
      });

      console.log('[useEmployeeActions] Calling admin-create-user edge function...');
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role || 'servicemedarbejder'
        }
      });
      
      console.log('[useEmployeeActions] Edge function response:', { data, error });
      
      if (error) {
        console.error('[useEmployeeActions] Edge function error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('[useEmployeeActions] Edge function returned error:', data.error);
        throw new Error(data.error);
      }
      
      // Update profile with additional fields
      if (data?.id) {
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
          console.warn('[useEmployeeActions] Profile update warning:', profileError);
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
      console.error('[useEmployeeActions] Creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateEmployee = async (employee: Employee, formData: any) => {
    try {
      console.log('[useEmployeeActions] Updating employee:', {
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
      
      if (profileError) throw profileError;
      
      // Handle role update if changed
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
        description: t('employees.employeeUpdateMsg', { name: formData.name })
      });
      
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('[useEmployeeActions] Update error:', err);
      const errorMessage = err instanceof Error ? err.message : t('employees.updateError');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteEmployee = async (employeeId: string, allEmployees: Employee[]) => {
    try {
      const employee = allEmployees.find(e => e.id === employeeId);
      if (!employee) throw new Error('Employee not found');
      
      console.log('[useEmployeeActions] Deleting employee:', employeeId);
      
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: { userId: employeeId }
      });
      
      if (error) throw new Error(`Server error: ${error.message}`);
      if (data?.error) throw new Error(data.error);
      
      toast({
        title: t('employees.employeeDeleted'),
        description: t('employees.employeeDeletedMsg', { name: employee.name })
      });
      
      await refreshEmployees();
      return true;
    } catch (err) {
      console.error('[useEmployeeActions] Delete error:', err);
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
    toggleEmployeeLeave
  };
};
