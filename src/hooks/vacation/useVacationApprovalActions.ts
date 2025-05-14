
import { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';

export const useVacationApprovalActions = (fetchVacations: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const { addNotification } = useNotifications();

  // Get the employee data associated with a vacation request
  const getEmployeeForVacation = async (vacation: Vacation) => {
    const { data: employee, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', vacation.userId)
      .single();
      
    if (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
    
    return employee;
  };

  // Approve a vacation request
  const approveVacation = async (vacation: Vacation, note?: string) => {
    if (!vacation || !user) return false;
    
    try {
      setIsApproving(true);
      
      // Update the vacation status
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: note || null
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Get the employee who requested the vacation
      const employee = await getEmployeeForVacation(vacation);
      
      if (!employee) {
        throw new Error('Could not find employee data');
      }
      
      // Show success toast
      toast({
        title: t('vacation.requestApproved'),
        description: t('vacation.requestApprovedMsg', {
          name: employee.name
        })
      });
      
      // Send notification to the employee
      if (employee.id !== user.id) {
        addNotification({
          type: 'vacation',
          title: t('notifications.vacationApproved'),
          message: t('notifications.vacationApproved'),
          link: '/vacation',
          targetUserId: employee.id
        });
      }
      
      // After approval, update any employee leave statuses based on vacation dates
      const { updateEmployeeLeaveStatusFromVacations } = await import('../employee/useEmployeeActions');
      await updateEmployeeLeaveStatusFromVacations();
      
      // Refresh the vacation list
      fetchVacations();
      
      return true;
    } catch (err) {
      console.error('Error approving vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error approving vacation request',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  // Reject a vacation request
  const rejectVacation = async (vacation: Vacation, reason?: string) => {
    if (!vacation || !user) return false;
    
    try {
      setIsRejecting(true);
      
      // Update the vacation status
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: reason || null
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Get the employee who requested the vacation
      const employee = await getEmployeeForVacation(vacation);
      
      if (!employee) {
        throw new Error('Could not find employee data');
      }
      
      // Show success toast
      toast({
        title: t('vacation.requestRejected'),
        description: t('vacation.requestRejectedMsg', {
          name: employee.name
        })
      });
      
      // Send notification to the employee
      if (employee.id !== user.id) {
        addNotification({
          type: 'vacation',
          title: t('notifications.vacationRejected'),
          message: t('notifications.vacationRejected', { 
            reason: reason || t('common.noReasonProvided')
          }),
          link: '/vacation',
          targetUserId: employee.id
        });
      }
      
      // Refresh the vacation list
      fetchVacations();
      
      return true;
    } catch (err) {
      console.error('Error rejecting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error rejecting vacation request',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsRejecting(false);
    }
  };

  return {
    isApproving,
    isRejecting,
    approveVacation,
    rejectVacation
  };
};
