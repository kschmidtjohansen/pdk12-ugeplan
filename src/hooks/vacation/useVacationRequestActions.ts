
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { VacationRequestType } from '@/types/vacation';

export const useVacationRequestActions = (fetchVacations: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();

  const submitVacationRequest = async (
    data: {
      dateRange: DateRange;
      requestType: VacationRequestType;
      startTime?: string;
      endTime?: string;
      reason: string;
    },
    isAdminRequest: boolean = false,
    selectedEmployeeId: string = '',
    employees: any[] = []
  ) => {
    const { dateRange, requestType, startTime, endTime, reason } = data;
    
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }

    if (requestType === 'partial_day' && (!startTime || !endTime)) {
      toast({
        title: t("vacation.timeMissing"),
        description: t("vacation.timeMissing"),
        variant: "destructive"
      });
      return false;
    }

    if (requestType === 'partial_day' && startTime && endTime && startTime >= endTime) {
      toast({
        title: t("vacation.invalidTimeRange"),
        description: t("vacation.invalidTimeRange"),
        variant: "destructive"
      });
      return false;
    }
    
    if (!user?.id) {
      toast({
        title: t("common.error"),
        description: t("common.authRequired"),
        variant: "destructive"
      });
      return false;
    }
    
    try {
      let requestEmployeeId = user.id;
      let requestEmployeeName = user.name;
      
      if (isAdminRequest && selectedEmployeeId) {
        const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
        if (selectedEmployee) {
          requestEmployeeId = selectedEmployee.id;
          requestEmployeeName = selectedEmployee.name;
        } else {
          toast({
            title: t("common.error"),
            description: t("vacation.employeeNotFound"),
            variant: "destructive"
          });
          return false;
        }
      }
      
      const startDateFormatted = format(dateRange.from, 'yyyy-MM-dd');
      const endDateFormatted = format(dateRange.to, 'yyyy-MM-dd');
      const isSameDay = startDateFormatted === endDateFormatted;
      
      console.log("Creating vacation record:", {
        user_id: requestEmployeeId,
        start_date: startDateFormatted,
        end_date: endDateFormatted,
        request_type: requestType,
        start_time: startTime,
        end_time: endTime,
        is_same_day: isSameDay,
        reason: reason,
        status: 'pending'
      });
      
      const vacationData = {
        user_id: requestEmployeeId,
        start_date: startDateFormatted,
        end_date: endDateFormatted,
        request_type: requestType,
        start_time: requestType === 'partial_day' ? startTime : null,
        end_time: requestType === 'partial_day' ? endTime : null,
        is_same_day: isSameDay,
        reason: reason,
        status: 'pending' as const
      };
      
      const { data, error } = await supabase
        .from('vacations')
        .insert([vacationData])
        .select();
      
      if (error) {
        console.error("Error inserting vacation:", error);
        throw error;
      }
      
      console.log("Vacation created successfully:", data);
      
      // Create notification message based on request type
      const timeInfo = requestType === 'partial_day' && startTime && endTime 
        ? ` ${t('vacation.timeRange')}: ${startTime} - ${endTime}`
        : '';
      
      if (isAdminRequest && user.id !== requestEmployeeId) {
        const adminMessage = requestType === 'partial_day' 
          ? t("vacation.partialDayRequest", { 
              name: requestEmployeeName, 
              startTime, 
              endTime 
            })
          : t("vacation.adminRequestSent", { name: requestEmployeeName });
          
        toast({
          title: t("vacation.adminRequestSubmitted"),
          description: adminMessage
        });
        
        try {
          const employeeMessage = requestType === 'partial_day'
            ? t("vacation.adminRequestedForYou", {
                adminName: user.name,
                from: format(dateRange.from, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'),
                to: format(dateRange.to, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')
              }) + timeInfo
            : t("vacation.adminRequestedForYou", {
                adminName: user.name,
                from: format(dateRange.from, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'),
                to: format(dateRange.to, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')
              });
              
          await addNotification({
            type: 'vacation',
            title: t("vacation.requestSubmittedForYou"),
            message: employeeMessage,
            link: '/vacation',
            targetUserId: requestEmployeeId
          });
        } catch (notifErr) {
          console.error("Error adding notification:", notifErr);
        }
      } else {
        toast({
          title: t("vacation.requestSubmitted"),
          description: t("vacation.requestSent")
        });
      }

      await notifyAdminsAboutVacationRequest(requestEmployeeName, dateRange.from, dateRange.to, requestType, startTime, endTime);
      
      fetchVacations();
      return true;
    } catch (err) {
      console.error('Error submitting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('vacation.requestError'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const notifyAdminsAboutVacationRequest = async (
    employeeName: string,
    startDate: Date,
    endDate: Date,
    requestType: VacationRequestType,
    startTime?: string,
    endTime?: string
  ) => {
    try {
      console.log("Fetching administrators to notify about new vacation request");
      
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['administrator', 'skadeleder']);
        
      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        return;
      }
      
      if (!adminUsers || adminUsers.length === 0) {
        console.log("No administrators found to notify");
        return;
      }
      
      console.log(`Found ${adminUsers.length} administrators to notify`);
      
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      const formattedStartDate = format(startDate, dateFormat);
      const formattedEndDate = format(endDate, dateFormat);
      
      const timeInfo = requestType === 'partial_day' && startTime && endTime
        ? ` (${startTime} - ${endTime})`
        : '';
      
      const notifyPromises = adminUsers
        .filter(admin => admin.user_id !== user?.id)
        .map(async (admin) => {
          try {
            console.log(`Sending notification to admin: ${admin.user_id}`);
            
            const notifyMessage = requestType === 'partial_day'
              ? `${employeeName} requesting partial day off from ${startTime} to ${endTime} on ${formattedStartDate}`
              : t("vacation.newVacationRequestActionRequired", {
                  name: employeeName,
                  from: formattedStartDate,
                  to: formattedEndDate
                }) + timeInfo;
            
            await addNotification({
              type: 'vacation',
              title: t("vacation.newVacationRequest"),
              message: notifyMessage,
              link: '/vacation',
              targetUserId: admin.user_id
            });
            
            console.log(`Notification sent to admin: ${admin.user_id}`);
            return true;
          } catch (notifErr) {
            console.error(`Error adding admin notification for ${admin.user_id}:`, notifErr);
            return false;
          }
        });
      
      const results = await Promise.allSettled(notifyPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      console.log(`Successfully sent ${successful} admin notifications out of ${adminUsers.length - 1}`);
    } catch (err) {
      console.error('Error in admin notification process:', err);
    }
  };

  return {
    submitVacationRequest
  };
};
