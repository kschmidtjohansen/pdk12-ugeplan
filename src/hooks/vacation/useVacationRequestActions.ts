
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

export const useVacationRequestActions = (fetchVacations: () => Promise<void>) => {
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
      
      console.log("Creating vacation record:", {
        user_id: requestEmployeeId,
        start_date: date.from.toISOString(),
        end_date: date.to.toISOString(),
        reason: reason,
        status: 'pending',
        isAdminRequest
      });
      
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
      
      if (error) {
        console.error("Error inserting vacation:", error);
        throw error;
      }
      
      console.log("Vacation created successfully:", data);
      
      // Different toast messages based on whether admin is making request for someone else
      if (isAdminRequest && user.id !== requestEmployeeId) {
        toast({
          title: t("vacation.adminRequestSubmitted"),
          description: t("vacation.adminRequestSent", { name: requestEmployeeName })
        });
        
        try {
          console.log("Adding notification for employee:", requestEmployeeId);
          
          // Notify the employee that an admin has made a vacation request for them
          await addNotification({
            type: 'vacation',
            title: t("vacation.requestSubmittedForYou"),
            message: t("vacation.adminRequestedForYou", {
              adminName: user.name,
              from: format(date.from, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'),
              to: format(date.to, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')
            }),
            link: '/vacation',
            targetUserId: requestEmployeeId
          });
          
          console.log("Notification added for employee");
        } catch (notifErr) {
          console.error("Error adding notification:", notifErr);
          // Don't throw here - we want the vacation to be successful even if notification fails
        }
      } else {
        toast({
          title: t("vacation.requestSubmitted"),
          description: t("vacation.requestSent")
        });
      }

      try {
        // Fetch administrators and skadeledere
        const { data: adminUsers, error: adminError } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['administrator', 'skadeleder']);
          
        if (adminError) {
          console.error('Error fetching admin users:', adminError);
        } else if (adminUsers) {
          const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
          const formattedStartDate = format(date.from, dateFormat);
          const formattedEndDate = format(date.to, dateFormat);
          
          console.log("Sending notifications to admins:", adminUsers);
          
          // Send notification to all admin users with action instructions
          for (const admin of adminUsers.filter(a => a.user_id !== user?.id)) {
            try {
              await addNotification({
                type: 'vacation',
                title: t("notifications.newVacationRequest"),
                message: t("notifications.newVacationRequestActionRequired", {
                  name: requestEmployeeName,
                  from: formattedStartDate,
                  to: formattedEndDate
                }),
                link: '/vacation',
                targetUserId: admin.user_id
              });
            } catch (notifErr) {
              console.error('Error adding admin notification:', notifErr);
              // Continue with other admins even if one notification fails
            }
          }
        }
      } catch (adminNotifErr) {
        console.error('Error in admin notification process:', adminNotifErr);
        // Don't throw here - the vacation submission itself was successful
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

  return {
    submitVacationRequest
  };
};
