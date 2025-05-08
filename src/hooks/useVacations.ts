
import { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useEmployees } from './useEmployees';
import { submitVacation } from '@/services/vacationService';
import { useVacationForm } from './useVacationForm';
import { useVacationData } from './useVacationData';
import { useVacationActions } from './useVacationActions';

export const useVacations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const { employees } = useEmployees();
  const [activeTab, setActiveTab] = useState('');
  
  // Get form state from useVacationForm
  const {
    date,
    setDate,
    reason,
    setReason,
    note,
    setNote,
    selectedEmployeeId,
    setSelectedEmployeeId,
    dialogOpen,
    setDialogOpen,
    adminDialogOpen,
    setAdminDialogOpen,
    resetForm
  } = useVacationForm();

  // Get vacation data and state management
  const {
    vacations,
    addVacation,
    isLoading,
    actionVacation,
    setActionVacation,
    noteDialogOpen,
    setNoteDialogOpen,
    handleApproveClick,
    handleRejectClick,
    updateVacationInState
  } = useVacationData();

  // Get vacation action handlers
  const {
    approveVacation,
    rejectVacation,
    notifyAdminsAboutVacationRequest
  } = useVacationActions(updateVacationInState);

  // Submit vacation request function
  const submitVacationRequest = async (e: React.FormEvent, isAdminRequest: boolean = false) => {
    e.preventDefault();
    if (!date.from || !date.to || !user) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }
    
    // Determine whose vacation is being requested
    let requestEmployeeId = user.id || '';
    let requestEmployeeName = user.name || '';
    
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
    
    try {
      // Submit to database
      const newVacation = await submitVacation(
        requestEmployeeId,
        date.from,
        date.to,
        reason,
        note
      );

      if (newVacation) {
        // Add to local state
        addVacation(newVacation);
      }
      
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
      if (user?.role !== 'administrator') {
        notifyAdminsAboutVacationRequest(requestEmployeeName, date.from, date.to);
      }

      // Reset the form
      resetForm();
      
      return true;
    } catch (error) {
      console.error('Error submitting vacation request:', error);
      toast({
        title: t('common.error'),
        description: t('vacation.submitError'),
        variant: "destructive",
      });
      return false;
    }
  };

  // Handler for approve/reject dialog action
  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionVacation) return;
    
    if (actionVacation.status === 'rejected') {
      rejectVacation(actionVacation, note);
    } else {
      approveVacation(actionVacation, note);
    }
    
    setNoteDialogOpen(false);
  };

  return {
    vacations,
    date,
    setDate,
    reason,
    setReason,
    note,
    setNote,
    dialogOpen,
    setDialogOpen,
    adminDialogOpen,
    setAdminDialogOpen,
    selectedEmployeeId,
    setSelectedEmployeeId,
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    isLoading,
    activeTab,
    setActiveTab,
    actionVacation,
    setActionVacation,
    noteDialogOpen,
    setNoteDialogOpen,
    handleApproveClick,
    handleRejectClick,
    handleAction
  };
};
