
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle employee leave-related actions
 */
export const useEmployeeLeaveActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  /**
   * Update employee onLeave status
   */
  const toggleEmployeeLeave = async (employee: any, allEmployees: any[]) => {
    if (!employee?.id) return false;
    
    try {
      // Toggle the onLeave status
      const { data, error } = await supabase
        .from('profiles')
        .update({ on_leave: !employee.onLeave })
        .eq('id', employee.id)
        .select();
      
      if (error) throw error;
      
      // Show toast notification
      toast({
        title: employee.onLeave 
          ? t('employees.employeeAvailable') 
          : t('employees.employeeOnLeave'),
        description: employee.onLeave 
          ? t('employees.employeeAvailableMsg', { name: employee.name }) 
          : t('employees.employeeOnLeaveMsg', { name: employee.name })
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

  return {
    toggleEmployeeLeave,
  };
};
