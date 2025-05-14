
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';
import { useNotifications } from '@/context/NotificationContext';

export const useVacationApprovalActions = (
  fetchVacations: () => Promise<void>
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Approve vacation request
  const approveVacation = async (vacation: Vacation, note?: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      
      // Update the vacation status in the database
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: note || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Refresh vacation data
      await fetchVacations();
      
      // Show success toast
      toast({
        title: t('vacation.requestApproved'),
        description: t('vacation.requestApprovedMsg', { name: vacation.employeeName }),
      });
      
      // Notify the employee
      await addNotification({
        type: 'vacation',
        title: t('vacation.vacationApproved'),
        message: t('vacation.yourRequestApproved'),
        link: '/vacation',
        targetUserId: vacation.employeeId
      });
      
      return true;
    } catch (err) {
      console.error('Error approving vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to approve vacation request',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reject vacation request
  const rejectVacation = async (vacation: Vacation, reason: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      
      // Update the vacation status in the database
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Refresh vacation data
      await fetchVacations();
      
      // Show success toast
      toast({
        title: t('vacation.requestRejected'),
        description: t('vacation.requestRejectedMsg', { name: vacation.employeeName }),
      });
      
      // Notify the employee
      await addNotification({
        type: 'vacation',
        title: t('vacation.vacationStatusChanged'),
        message: t('vacation.yourRequestRejected', { reason: reason }),
        link: '/vacation',
        targetUserId: vacation.employeeId
      });
      
      return true;
    } catch (err) {
      console.error('Error rejecting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to reject vacation request',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    approveVacation,
    rejectVacation
  };
};

