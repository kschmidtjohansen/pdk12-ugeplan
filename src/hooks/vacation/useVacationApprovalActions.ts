
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
          // Create notification in the system
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([
              {
                user_id: vacation.employeeId,
                type: 'vacation',
                title: t("vacation.requestApproved"),
                message: t("vacation.yourRequestApproved"),
                read: false,
                link: '/vacation'
              }
            ]);
          
          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
          
          // Add notification to local context
          addNotification({
            id: new Date().getTime().toString(),
            user_id: vacation.employeeId,
            type: 'vacation',
            title: t("vacation.requestApproved"),
            message: t("vacation.yourRequestApproved"),
            read: false,
            date: new Date(),
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
          // Create notification in the system
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([
              {
                user_id: vacation.employeeId,
                type: 'vacation',
                title: t("vacation.requestRejected"),
                message: t("vacation.yourRequestRejected", { reason: noteText || t('common.noReasonProvided') }),
                read: false,
                link: '/vacation'
              }
            ]);
          
          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
          
          // Add notification to local context
          addNotification({
            id: new Date().getTime().toString(),
            user_id: vacation.employeeId,
            type: 'vacation',
            title: t("vacation.requestRejected"),
            message: t("vacation.yourRequestRejected", { reason: noteText || t('common.noReasonProvided') }),
            read: false,
            date: new Date(),
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
