
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Vacation } from '@/types/vacation';
import { useVacationData } from './useVacationData';
import { useVacationApprovalActions } from './useVacationApprovalActions';
import { useNotifications } from '@/context/NotificationContext';

export const useVacationRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeRequest, setActiveRequest] = useState<Vacation | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState<boolean>(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState<boolean>(false);
  
  const { vacations, fetchVacations } = useVacationData();
  const { approveVacation, rejectVacation } = useVacationApprovalActions(fetchVacations);

  // Submit a new vacation request
  const submitVacationRequest = async (
    startDate: Date | undefined,
    endDate: Date | undefined,
    reason: string,
    employeeId?: string,
    employeeName?: string
  ) => {
    if (!startDate || !endDate) {
      toast({
        title: t('common.error'),
        description: t('vacation.missingDates'),
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Use the provided employee ID or the current user's ID
      const actualEmployeeId = employeeId || user?.id;
      const actualEmployeeName = employeeName || user?.name;
      
      if (!actualEmployeeId) {
        throw new Error('No employee ID provided');
      }
      
      // Format dates for submission
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('vacations')
        .insert([
          {
            user_id: actualEmployeeId,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            reason: reason,
            status: 'pending'
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Refresh the vacation data
      await fetchVacations();
      
      // Show success message
      if (employeeId && employeeId !== user?.id) {
        toast({
          title: t('vacation.adminRequestSubmitted'),
          description: t('vacation.adminRequestSent', { name: actualEmployeeName }),
        });
        
        // Notify the employee - we'll use the context function instead of direct DB insert
        const notifyMessage = t('vacation.adminRequestedForYou', { 
          adminName: user?.name,
          from: format(startDate, 'dd.MM.yyyy'),
          to: format(endDate, 'dd.MM.yyyy')
        });
        
        addNotification({
          type: 'vacation',
          title: t('vacation.requestSubmittedForYou'),
          message: notifyMessage,
          link: '/vacation'
        });
      } else {
        toast({
          title: t('vacation.requestSubmitted'),
          description: t('vacation.requestSent'),
        });
      }
      
      // Notify administrators about the new vacation request
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['administrator', 'skadeleder']);
        
      if (adminError) {
        console.error('Error fetching admin users:', adminError);
      } else if (adminUsers) {
        // For each admin, use the context to add a notification
        adminUsers
          .filter(admin => admin.user_id !== user?.id) // Don't notify yourself
          .forEach(admin => {
            const notifyMessage = t('notifications.newVacationRequestMsg', {
              name: actualEmployeeName,
              from: format(startDate, 'dd.MM.yyyy'),
              to: format(endDate, 'dd.MM.yyyy')
            });
            
            // Add notification using the context
            addNotification({
              type: 'vacation',
              title: t('notifications.newVacationRequest'),
              message: notifyMessage,
              link: '/vacation'
            });
          });
      }
      
      return true;
    } catch (err) {
      console.error('Error submitting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to submit vacation request',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Open approval dialog
  const openApprovalDialog = (vacation: Vacation) => {
    setActiveRequest(vacation);
    setIsApprovalDialogOpen(true);
  };
  
  // Open rejection dialog
  const openRejectionDialog = (vacation: Vacation) => {
    setActiveRequest(vacation);
    setIsRejectionDialogOpen(true);
  };
  
  // Handle vacation approval
  const handleApproveVacation = async (noteText: string) => {
    if (!activeRequest) return;
    
    const success = await approveVacation(activeRequest, noteText);
    
    if (success) {
      setIsApprovalDialogOpen(false);
      setActiveRequest(null);
    }
  };
  
  // Handle vacation rejection
  const handleRejectVacation = async (noteText: string) => {
    if (!activeRequest) return;
    
    const success = await rejectVacation(activeRequest, noteText);
    
    if (success) {
      setIsRejectionDialogOpen(false);
      setActiveRequest(null);
    }
  };

  return {
    vacations,
    isSubmitting,
    activeRequest,
    isApprovalDialogOpen,
    isRejectionDialogOpen,
    submitVacationRequest,
    openApprovalDialog,
    openRejectionDialog,
    handleApproveVacation,
    handleRejectVacation,
    setIsApprovalDialogOpen,
    setIsRejectionDialogOpen
  };
};
