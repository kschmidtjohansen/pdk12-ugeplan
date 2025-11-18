
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { Employee } from '@/types/employee';
import { validateAndSanitizePhone } from '@/utils/phoneValidation';
import { useAuth } from '@/context/AuthContext';
import { DemoUserService } from '@/services/demoUserService';

export const useEmployeeActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();

  const toggleEmployeeLeave = async (employee: Employee, setOnLeave: boolean, notes: string | null = null) => {
    try {
      console.log('[useEmployeeActions] Updating employee leave status:', {
        employeeId: employee.id,
        onLeave: setOnLeave
      });
      
      // Virtualize for demo mode
      if (isDemoMode && (employee.id.startsWith('demo-') || (employee as any).isDemoData)) {
        DemoUserService.getInstance().updateDemoEmployee(employee.id, {
          on_leave: setOnLeave,
          notes: notes || null,
          updated_at: new Date().toISOString()
        });
        
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
      }
      
      const client = getSchemaClient(isDemoMode);
      const { error } = await client
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
      
      // Virtualize for demo mode
      if (isDemoMode && (employee.id.startsWith('demo-') || (employee as any).isDemoData)) {
        DemoUserService.getInstance().updateDemoEmployee(employee.id, {
          name: formData.name,
          email: formData.email,
          phone: phoneValidation.sanitized,
          job_title: formData.jobTitle || null,
          role: formData.role,
          on_leave: formData.onLeave || false,
          notes: formData.notes || null,
          has_asbestos_certificate: formData.has_asbestos_certificate ?? false,
          has_trailer_license: formData.has_trailer_license ?? false,
          has_drivers_license: formData.has_drivers_license ?? false,
          has_forklift_license: formData.has_forklift_license ?? false,
          updated_at: new Date().toISOString()
        });
        
        toast({
          title: t('employees.employeeUpdated'),
          description: t('employees.employeeUpdatedMsg', { name: formData.name })
        });
        
        await refreshEmployees();
        return true;
      }
      
      // Update profile
      const client = getSchemaClient(isDemoMode);
      const { error: profileError } = await client
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone: phoneValidation.sanitized,
          job_title: formData.jobTitle || null,
          on_leave: formData.onLeave || false,
          notes: formData.notes || null,
          has_asbestos_certificate: formData.has_asbestos_certificate ?? false,
          has_trailer_license: formData.has_trailer_license ?? false,
          has_drivers_license: formData.has_drivers_license ?? false,
          has_forklift_license: formData.has_forklift_license ?? false,
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
        description: t('employees.employeeUpdatedMsg', { name: formData.name })
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
      
      // Virtualize for demo mode
      if (isDemoMode && (employeeId.startsWith('demo-') || (employee as any).isDemoData)) {
        DemoUserService.getInstance().deleteDemoEmployee(employeeId);
        
        toast({
          title: t('employees.employeeDeleted'),
          description: t('employees.employeeDeletedMsg', { name: employee.name })
        });
        
        await refreshEmployees();
        return true;
      }
      
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
