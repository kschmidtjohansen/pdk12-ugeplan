
import { format } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing vacation-related notifications
 */
export const useVacationNotifications = () => {
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  
  /**
   * Notify administrators about a new vacation request
   */
  const notifyAdmins = async (
    employeeName: string, 
    startDate: Date, 
    endDate: Date
  ) => {
    try {
      // Fetch administrators and skadeledere
      const { data: adminUsers, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['administrator', 'skadeleder']);
      
      if (error) {
        console.error('Error fetching admin users:', error);
        return;
      }
      
      if (!adminUsers || adminUsers.length === 0) {
        console.log('No administrators found to notify');
        return;
      }
      
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      
      // Notify each admin (except the requester if they're an admin)
      for (const admin of adminUsers) {
        if (admin.user_id !== user?.id) {
          const message = t('notifications.newVacationRequestActionRequired', {
            name: employeeName,
            from: format(startDate, dateFormat),
            to: format(endDate, dateFormat)
          });
          
          await addNotification({
            type: 'vacation',
            title: t('notifications.newVacationRequest'),
            message,
            link: '/vacation',
            targetUserId: admin.user_id
          });
        }
      }
    } catch (err) {
      console.error('Error notifying admins:', err);
    }
  };
  
  /**
   * Notify an employee about a vacation request made on their behalf
   */
  const notifyEmployee = async (
    employeeId: string,
    adminName: string,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      const message = t('vacation.adminRequestedForYou', {
        adminName,
        from: format(startDate, dateFormat),
        to: format(endDate, dateFormat)
      });
      
      await addNotification({
        type: 'vacation',
        title: t('vacation.requestSubmittedForYou'),
        message,
        link: '/vacation',
        targetUserId: employeeId
      });
      
      return true;
    } catch (err) {
      console.error('Error notifying employee:', err);
      return false;
    }
  };
  
  /**
   * Notify an employee about the status change of their vacation request
   */
  const notifyEmployeeOfStatusChange = async (
    employeeId: string,
    approved: boolean,
    reason?: string
  ) => {
    try {
      const title = t('notifications.vacationStatusChanged');
      const message = approved 
        ? t('notifications.vacationApproved')
        : t('notifications.vacationRejected', { reason: reason || '' });
      
      await addNotification({
        type: 'vacation',
        title,
        message,
        link: '/vacation',
        targetUserId: employeeId
      });
      
      return true;
    } catch (err) {
      console.error('Error notifying employee of status change:', err);
      return false;
    }
  };
  
  return {
    notifyAdmins,
    notifyEmployee,
    notifyEmployeeOfStatusChange
  };
};
