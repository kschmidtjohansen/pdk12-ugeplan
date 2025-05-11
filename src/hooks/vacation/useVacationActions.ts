
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useVacationRequestActions } from './useVacationRequestActions';
import { Vacation } from '@/types/vacation';
import { supabase } from '@/integrations/supabase/client';

export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { submitVacationRequest } = useVacationRequestActions(fetchVacations);

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
        link: '/vacation'
      }, vacation.employeeId);
      
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
        link: '/vacation'
      }, vacation.employeeId);
      
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
      // Only allow editing of pending vacations
      if (vacation.status !== 'pending') {
        toast({
          title: t('common.error'),
          description: t('vacation.cannotEditNonPending'),
          variant: 'destructive',
        });
        return;
      }
      
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
      // Only allow deletion of pending vacations
      if (vacation.status !== 'pending') {
        toast({
          title: t('common.error'),
          description: t('vacation.cannotDeleteNonPending'),
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Display toast notification
      toast({
        title: t('vacation.requestDeleted'),
        description: t('vacation.requestDeletedMsg'),
      });
      
      // Refresh vacation list
      fetchVacations();
      
    } catch (err) {
      console.error('Error deleting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting vacation request',
        variant: 'destructive',
      });
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
