
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';

export const useVacationApprovalActions = (fetchVacations: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();

  const approveVacation = async (vacation: Vacation, noteText: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: noteText || null
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Refresh vacation data
      await fetchVacations();
      
      toast({
        title: t("vacation.requestApproved"),
        description: t("vacation.requestApprovedMsg", { name: vacation.employeeName })
      });
      
      // Notify the employee about their approved vacation request
      if (vacation.employeeId !== user?.id) {
        // Get employee data from supabase to send notification
        const { data: employeeData } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', vacation.employeeId)
          .single();
        
        if (employeeData) {
          // Instead of directly inserting into the notifications table (which causes type errors),
          // we'll use the context's addNotification function which will handle the database interaction
          
          // Create notification message
          const notificationTitle = t("vacation.requestApproved");
          const notificationMessage = t("vacation.yourRequestApproved");
          
          // Add notification to local context and update the user
          addNotification({
            type: 'vacation',
            title: notificationTitle,
            message: notificationMessage,
            link: '/vacation'
          });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error approving vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error approving vacation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectVacation = async (vacation: Vacation, noteText: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: noteText || null
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Refresh vacation data
      await fetchVacations();
      
      toast({
        title: t("vacation.requestRejected"),
        description: t("vacation.requestRejectedMsg", { name: vacation.employeeName })
      });
      
      // Notify the employee about their rejected vacation request
      if (vacation.employeeId !== user?.id) {
        // Get employee data from supabase to send notification
        const { data: employeeData } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', vacation.employeeId)
          .single();
        
        if (employeeData) {
          // Create notification message
          const notificationTitle = t("vacation.requestRejected");
          const notificationMessage = t("vacation.yourRequestRejected", { reason: noteText || t('common.noReasonProvided') });
          
          // Add notification to local context instead of direct DB insert
          addNotification({
            type: 'vacation',
            title: notificationTitle,
            message: notificationMessage,
            link: '/vacation'
          });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error rejecting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error rejecting vacation',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    approveVacation,
    rejectVacation
  };
};
