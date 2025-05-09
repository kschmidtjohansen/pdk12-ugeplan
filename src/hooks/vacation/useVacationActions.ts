
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';
import { DateRange } from 'react-day-picker';

export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();

  const submitVacationRequest = async (
    e: React.FormEvent, 
    date: DateRange, 
    reason: string,
    isAdminRequest: boolean = false, 
    selectedEmployeeId: string = '', 
    employees: any[] = []
  ) => {
    e.preventDefault();
    if (!date.from || !date.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }
    
    // Make sure we have a user ID
    if (!user?.id) {
      toast({
        title: t("common.error"),
        description: t("common.authRequired"),
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Determine whose vacation is being requested
      let requestEmployeeId = user.id;
      let requestEmployeeName = user.name;
      
      // If admin is making request for someone else
      if (isAdminRequest && selectedEmployeeId) {
        const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
        if (selectedEmployee) {
          requestEmployeeId = selectedEmployee.id;
          requestEmployeeName = selectedEmployee.name;
        } else {
          toast({
            title: t("vacation.error"),
            description: t("vacation.employeeNotFound"),
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Create the vacation record
      const { data, error } = await supabase
        .from('vacations')
        .insert([
          {
            user_id: requestEmployeeId,
            start_date: date.from.toISOString(),
            end_date: date.to.toISOString(),
            reason: reason,
            status: 'pending'
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Different toast messages based on whether admin is making request for someone else
      if (isAdminRequest && user.id !== requestEmployeeId) {
        toast({
          title: t("vacation.adminRequestSubmitted"),
          description: t("vacation.adminRequestSent", { name: requestEmployeeName })
        });
        
        // Notify the employee that an admin has made a vacation request for them
        addNotification({
          type: 'vacation',
          title: t("vacation.requestSubmittedForYou"),
          message: t("vacation.adminRequestedForYou", {
            adminName: user.name,
            from: format(date.from, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'),
            to: format(date.to, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')
          }),
          link: '/vacation'
        });
      } else {
        toast({
          title: t("vacation.requestSubmitted"),
          description: t("vacation.requestSent")
        });
      }

      // Generate notification for administrators
      if (user.role !== 'administrator') {
        const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
        const formattedStartDate = format(date.from, dateFormat);
        const formattedEndDate = format(date.to, dateFormat);
        addNotification({
          type: 'vacation',
          title: t("notifications.newVacationRequest"),
          message: t("notifications.newVacationRequestMsg", {
            name: requestEmployeeName,
            from: formattedStartDate,
            to: formattedEndDate
          }),
          link: '/vacation'
        });
      }
      
      // Refresh the vacation list
      fetchVacations();
      
      return true;
    } catch (err) {
      console.error('Error submitting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error submitting vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

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
        addNotification({
          type: 'vacation',
          title: t("vacation.requestApproved"),
          message: t("vacation.yourRequestApproved"),
          link: '/vacation'
        });
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
        addNotification({
          type: 'vacation',
          title: t("vacation.requestRejected"),
          message: t("vacation.yourRequestRejected", { reason: noteText }),
          link: '/vacation'
        });
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
    submitVacationRequest,
    approveVacation,
    rejectVacation
  };
};
