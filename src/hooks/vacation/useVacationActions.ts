import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useVacationRequestActions } from './useVacationRequestActions';
import { Vacation } from '@/types/vacation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { submitVacationRequest } = useVacationRequestActions(fetchVacations);
  const { isAdmin } = useAuth();

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
      addNotification({
        type: 'vacation',
        title: t('notifications.vacationStatusChanged'),
        message: t('notifications.vacationApproved'),
        link: '/vacation',
        targetUserId: vacation.employeeId
      });
      
      // After approval, update employee leave status if vacation starts today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(vacation.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate.getTime() <= today.getTime()) {
        await supabase
          .from('profiles')
          .update({
            on_leave: true
          })
          .eq('id', vacation.employeeId);
      }
      
      // Refresh vacation list
      fetchVacations();

    } catch (err) {
      console.error('Error approving vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error approving vacation request',
        variant: 'destructive',
      });
    }
  };

  const rejectVacation = async (vacation: Vacation, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: t('common.error'),
        description: t('vacation.rejectionReasonRequired'),
        variant: 'destructive',
      });
      return;
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
      addNotification({
        type: 'vacation',
        title: t('notifications.vacationStatusChanged'),
        message: t('notifications.vacationRejected', { reason }),
        link: '/vacation',
        targetUserId: vacation.employeeId
      });
      
      // Refresh vacation list
      fetchVacations();

    } catch (err) {
      console.error('Error rejecting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error rejecting vacation request',
        variant: 'destructive',
      });
    }
  };

  const editVacation = async (
    vacation: Vacation, 
    startDate: Date,
    endDate: Date,
    reason: string
  ) => {
    try {
      // Allow administrators to edit any vacation regardless of status
      // For regular users, allow editing of their own vacations regardless of status
      const { error } = await supabase
        .from('vacations')
        .update({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Display toast notification
      toast({
        title: t('vacation.requestUpdated'),
        description: t('vacation.requestUpdatedMsg'),
      });
      
      // Refresh vacation list
      fetchVacations();
      
    } catch (err) {
      console.error('Error editing vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating vacation request',
        variant: 'destructive',
      });
    }
  };
  
  const deleteVacation = async (vacation: Vacation) => {
    try {
      console.log("Starting deletion process for vacation:", vacation.id);
      
      // Allow administrators to delete any vacation regardless of status
      // For regular users, allow deletion of their own vacations regardless of status      
      const { error, data } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacation.id)
        .select();
      
      if (error) {
        console.error("Error during vacation deletion:", error);
        throw error;
      }
      
      console.log("Vacation deleted successfully:", vacation.id, "Response data:", data);
      
      // Display toast notification
      toast({
        title: t('vacation.requestDeleted'),
        description: t('vacation.requestDeletedMsg'),
      });

      // If deleting an approved vacation and the employee is on leave because of it,
      // check if they should be marked as available again
      if (vacation.status === 'approved') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDate = new Date(vacation.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(vacation.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        if (today >= startDate && today <= endDate) {
          // Check if there are any other active vacations for this employee
          const { data: otherVacations } = await supabase
            .from('vacations')
            .select('*')
            .eq('user_id', vacation.employeeId)
            .eq('status', 'approved')
            .lte('start_date', today.toISOString().split('T')[0])
            .gte('end_date', today.toISOString().split('T')[0])
            .neq('id', vacation.id);
          
          // If no other active vacations, mark as available
          if (!otherVacations || otherVacations.length === 0) {
            await supabase
              .from('profiles')
              .update({
                on_leave: false
              })
              .eq('id', vacation.employeeId);
          }
        }
      }
      
      // Refresh vacation list - use await to ensure it completes
      await fetchVacations();
      
      return true;
      
    } catch (err) {
      console.error('Error deleting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    editVacation,
    deleteVacation
  };
};
