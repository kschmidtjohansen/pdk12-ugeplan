
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useVacationNotifications } from './useVacationNotifications';
import { Vacation } from '@/types/vacation';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing vacation approval and rejection actions
 */
export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { notifyEmployeeOfStatusChange } = useVacationNotifications();

  /**
   * Approve a vacation request
   */
  const approveVacation = async (vacation: Vacation, note: string = '') => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: note || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;

      // Display toast notification
      toast({
        title: t('vacation.requestApproved'),
        description: t('vacation.requestApprovedMsg', { name: vacation.employeeName })
      });

      // Add notification for the employee
      await notifyEmployeeOfStatusChange(vacation.employeeId, true);
      
      // Update employee on-leave status if vacation starts today
      await updateEmployeeLeaveStatus(vacation);
      
      // Refresh vacation list
      await fetchVacations();
      return true;
    } catch (err) {
      console.error('Error approving vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error approving vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Reject a vacation request
   */
  const rejectVacation = async (vacation: Vacation, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: t('common.error'),
        description: t('vacation.rejectionReasonRequired'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;

      // Display toast notification
      toast({
        title: t('vacation.requestRejected'),
        description: t('vacation.requestRejectedMsg', { name: vacation.employeeName })
      });

      // Add notification for the employee
      await notifyEmployeeOfStatusChange(vacation.employeeId, false, reason);
      
      // Refresh vacation list
      await fetchVacations();
      return true;
    } catch (err) {
      console.error('Error rejecting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error rejecting vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Update employee leave status when a vacation is approved
   */
  const updateEmployeeLeaveStatus = async (vacation: Vacation) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(vacation.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      // If vacation starts today or earlier, mark employee as on leave
      if (startDate.getTime() <= today.getTime()) {
        await supabase
          .from('profiles')
          .update({
            on_leave: true
          })
          .eq('id', vacation.employeeId);
      }
    } catch (err) {
      console.error('Error updating employee leave status:', err);
    }
  };

  return {
    approveVacation,
    rejectVacation
  };
};
