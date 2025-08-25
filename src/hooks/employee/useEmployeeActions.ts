
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';
import { validateAndSanitizePhone } from '@/utils/phoneValidation';

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


  const updateEmployee = async (employee: Employee, formData: any) => {
    try {
      console.log('[useEmployeeActions] Updating employee:', {
        employeeId: employee.id,
        roleChange: employee.role !== formData.role
      });
      
      // Validate phone number
      const phoneValidation = validateAndSanitizePhone(formData.phone);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number format');
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone: phoneValidation.sanitized,
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
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave
  };
};
