
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/context/TranslationContext";
import { useNotifications } from "@/context/NotificationContext";
import { Vacation } from "@/types/vacation";
import { updateVacationStatus } from "@/services/vacationService";
import { format } from "date-fns";

export const useVacationActions = (
  updateVacationInState: (vacationId: string, status: "pending" | "approved" | "rejected", notes?: string) => void
) => {
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  
  // Process vacation approval
  const approveVacation = async (vacation: Vacation, noteText: string) => {
    try {
      // Update in database
      const success = await updateVacationStatus(vacation.id, 'approved', noteText);
      
      if (success) {
        // Update local state
        updateVacationInState(vacation.id, 'approved', noteText);
        
        toast({
          title: t("vacation.requestApproved"),
          description: t("vacation.requestApprovedMsg", { name: vacation.employeeName })
        });
        
        // Notify the employee about their approved vacation request
        addNotification({
          type: 'vacation',
          title: t("vacation.requestApproved"),
          message: t("vacation.yourRequestApproved"),
          link: '/vacation'
        });
      }
    } catch (error) {
      console.error('Error approving vacation:', error);
      toast({
        title: t('common.error'),
        description: t('vacation.approveError'),
        variant: "destructive",
      });
    }
  };

  // Process vacation rejection
  const rejectVacation = async (vacation: Vacation, noteText: string) => {
    try {
      // Update in database
      const success = await updateVacationStatus(vacation.id, 'rejected', noteText);
      
      if (success) {
        // Update local state
        updateVacationInState(vacation.id, 'rejected', noteText);
        
        toast({
          title: t("vacation.requestRejected"),
          description: t("vacation.requestRejectedMsg", { name: vacation.employeeName })
        });
        
        // Notify the employee about their rejected vacation request
        addNotification({
          type: 'vacation',
          title: t("vacation.requestRejected"),
          message: t("vacation.yourRequestRejected", { reason: noteText }),
          link: '/vacation'
        });
      }
    } catch (error) {
      console.error('Error rejecting vacation:', error);
      toast({
        title: t('common.error'),
        description: t('vacation.rejectError'),
        variant: "destructive",
      });
    }
  };

  // Create notification for admin upon vacation request
  const notifyAdminsAboutVacationRequest = (userName: string, startDate: Date, endDate: Date) => {
    const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
    const formattedStartDate = format(startDate, dateFormat);
    const formattedEndDate = format(endDate, dateFormat);
    
    addNotification({
      type: 'vacation',
      title: t("notifications.newVacationRequest"),
      message: t("notifications.newVacationRequestMsg", {
        name: userName,
        from: formattedStartDate,
        to: formattedEndDate
      }),
      link: '/vacation'
    });
  };

  return {
    approveVacation,
    rejectVacation,
    notifyAdminsAboutVacationRequest
  };
};
