
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Vacation } from '@/types/vacation';
import { useVacationData } from './useVacationData';
import { useVacationApprovalActions } from './useVacationApprovalActions';
import { useNotifications } from '@/context/NotificationContext';

export const useVacationRequests = () => {
  const { user } = useAuth();
  const { currentDepartment } = useDepartment();
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
      
      if (!user || !currentDepartment) {
        console.error('No user or department available');
        toast({
          title: t('common.error'),
          description: 'Authentication or department error',
          variant: 'destructive',
        });
        return false;
      }

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
            status: 'pending',
            department_id: currentDepartment.id,
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
        
        // Notify the employee
        const notifyMessage = t('vacation.adminRequestedForYou', { 
          adminName: user?.name,
          from: format(startDate, 'dd.MM.yyyy'),
          to: format(endDate, 'dd.MM.yyyy')
        });
        
        await addNotification({
          type: 'vacation',
          title: t('vacation.requestSubmittedForYou'),
          message: notifyMessage,
          link: '/vacation',
          targetUserId: actualEmployeeId
        });
      } else {
        toast({
          title: t('vacation.requestSubmitted'),
          description: t('vacation.requestSent'),
        });
      }
      
      // Notify administrators about the new vacation request - enhanced with better logging
      await notifyAdmins(actualEmployeeName, startDate, endDate);
      
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

  // Helper function to notify administrators
  const notifyAdmins = async (employeeName: string, startDate: Date, endDate: Date) => {
    try {
      console.log('Notifying administrators about new vacation request');
      
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['administrator', 'skadeleder']);
        
      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        return;
      }
      
      if (!adminUsers || adminUsers.length === 0) {
        console.log('No administrators found');
        return;
      }
      
      console.log(`Found ${adminUsers.length} admins/skadeledere to notify`);
      
      // For each admin, send a notification
      for (const admin of adminUsers) {
        // Don't notify yourself if you're an admin making the request
        if (admin.user_id !== user?.id) {
          const notifyMessage = t('notifications.newVacationRequestActionRequired', {
            name: employeeName,
            from: format(startDate, 'dd.MM.yyyy'),
            to: format(endDate, 'dd.MM.yyyy')
          });
          
          console.log(`Sending notification to admin ${admin.user_id} (${admin.role})`);
          
          try {
            // Add notification using the context
            const notificationId = await addNotification({
              type: 'vacation',
              title: t('notifications.newVacationRequest'),
              message: notifyMessage,
              link: '/vacation',
              targetUserId: admin.user_id
            });
            
            console.log(`Notification sent to admin ${admin.user_id}, notification ID: ${notificationId}`);
          } catch (notifErr) {
            console.error(`Failed to send notification to admin ${admin.user_id}:`, notifErr);
          }
        }
      }
    } catch (err) {
      console.error('Error in admin notification process:', err);
      // Don't throw - we still want the vacation request to be created even if notifications fail
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
