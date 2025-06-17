import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { useNotifications } from '@/context/NotificationContext';
import { logSecurityEvent } from '@/utils/securityLogger';
import { useVacationSecurity } from './useVacationSecurity';

export const useVacationActions = (refreshVacations: () => Promise<void>) => {
  const { user, isAdmin, isSkadeleder } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { logVacationSecurityEvent, canEditVacation, canDeleteVacation } = useVacationSecurity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced vacation request submission with security logging
  const submitVacationRequest = async (
    requestData: {
      dateRange: { from: Date; to: Date };
      requestType: VacationRequestType;
      startTime?: string;
      endTime?: string;
      reason: string;
    },
    isAdminRequest: boolean = false,
    selectedEmployeeId?: string,
    employees?: any[]
  ) => {
    if (isSubmitting) return false;
    
    try {
      setIsSubmitting(true);
      
      // Security check for admin requests
      if (isAdminRequest && !isAdmin && !isSkadeleder) {
        await logSecurityEvent(
          'vacation_unauthorized_admin_request',
          'User attempted to create vacation request as admin without proper role',
          { user_role: user?.role },
          'warning'
        );
        
        toast({
          title: t('common.error'),
          description: 'Unauthorized: Admin privileges required',
          variant: "destructive",
        });
        return false;
      }

      const targetUserId = isAdminRequest ? selectedEmployeeId : user?.id;
      const targetEmployee = employees?.find(emp => emp.id === targetUserId);

      if (!targetUserId) {
        throw new Error('No target user ID provided');
      }

      // Format dates and prepare data
      const formattedStartDate = format(requestData.dateRange.from, 'yyyy-MM-dd');
      const formattedEndDate = format(requestData.dateRange.to, 'yyyy-MM-dd');
      const isSameDay = formattedStartDate === formattedEndDate;

      const vacationData = {
        user_id: targetUserId,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        request_type: requestData.requestType,
        start_time: requestData.requestType === 'partial_day' ? requestData.startTime : null,
        end_time: requestData.requestType === 'partial_day' ? requestData.endTime : null,
        is_same_day: isSameDay,
        reason: requestData.reason,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('vacations')
        .insert([vacationData])
        .select()
        .single();

      if (error) {
        // Enhanced error handling for RLS violations
        if (error.message.includes('row-level security policy')) {
          await logSecurityEvent(
            'vacation_rls_violation',
            'Vacation creation blocked by RLS policy',
            { 
              attempted_user_id: targetUserId,
              current_user_id: user?.id,
              error_message: error.message 
            },
            'warning'
          );
          
          toast({
            title: t('common.error'),
            description: 'Access denied: Cannot create vacation request',
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      // Log successful creation
      await logVacationSecurityEvent('created', data.id, {
        request_type: requestData.requestType,
        is_admin_request: isAdminRequest,
        target_user_id: targetUserId
      });

      // Refresh data and show success message
      await refreshVacations();
      
      const successMessage = isAdminRequest 
        ? t('vacation.adminRequestSent', { name: targetEmployee?.name || 'Employee' })
        : t('vacation.requestSent');
        
      toast({
        title: t('vacation.requestSubmitted'),
        description: successMessage,
      });

      return true;
    } catch (err) {
      console.error('Error submitting vacation request:', err);
      
      await logSecurityEvent(
        'vacation_submission_error',
        'Error occurred during vacation request submission',
        { 
          error: String(err),
          user_id: user?.id,
          is_admin_request: isAdminRequest 
        },
        'error'
      );
      
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

  // Enhanced edit vacation with security checks
  const editVacation = async (
    vacation: Vacation,
    startDate: Date,
    endDate: Date,
    reason: string,
    requestType: VacationRequestType,
    startTime?: string,
    endTime?: string
  ) => {
    if (!canEditVacation(vacation)) {
      toast({
        title: t('common.error'),
        description: 'You do not have permission to edit this vacation request',
        variant: "destructive",
      });
      return false;
    }

    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      const isSameDay = formattedStartDate === formattedEndDate;

      const { error } = await supabase
        .from('vacations')
        .update({
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          request_type: requestType,
          start_time: requestType === 'partial_day' ? startTime : null,
          end_time: requestType === 'partial_day' ? endTime : null,
          is_same_day: isSameDay,
          reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);

      if (error) {
        if (error.message.includes('row-level security policy')) {
          await logVacationSecurityEvent('unauthorized_edit', vacation.id, {
            reason: 'RLS policy blocked edit attempt'
          });
          
          toast({
            title: t('common.error'),
            description: 'Access denied: Cannot edit this vacation request',
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      await logVacationSecurityEvent('edited', vacation.id, {
        changes: {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          request_type: requestType,
          reason: reason
        }
      });

      await refreshVacations();
      
      toast({
        title: t('vacation.requestUpdated'),
        description: t('vacation.requestUpdatedMsg'),
      });

      return true;
    } catch (err) {
      console.error('Error editing vacation:', err);
      
      await logSecurityEvent(
        'vacation_edit_error',
        'Error occurred during vacation edit',
        { 
          vacation_id: vacation.id,
          error: String(err),
          user_id: user?.id 
        },
        'error'
      );
      
      toast({
        title: t('common.error'),
        description: t('vacation.editError'),
        variant: "destructive",
      });
      return false;
    }
  };

  // Enhanced delete vacation with security checks
  const deleteVacation = async (vacation: Vacation) => {
    if (!canDeleteVacation(vacation)) {
      toast({
        title: t('common.error'),
        description: 'You do not have permission to delete this vacation request',
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacation.id);

      if (error) {
        if (error.message.includes('row-level security policy')) {
          await logVacationSecurityEvent('unauthorized_delete', vacation.id, {
            reason: 'RLS policy blocked delete attempt'
          });
          
          toast({
            title: t('common.error'),
            description: 'Access denied: Cannot delete this vacation request',
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      await logVacationSecurityEvent('deleted', vacation.id, {
        deleted_by_user_id: user?.id,
        original_user_id: vacation.user_id
      });

      await refreshVacations();
      
      toast({
        title: t('vacation.requestDeleted'),
        description: t('vacation.requestDeletedMsg'),
      });

      return true;
    } catch (err) {
      console.error('Error deleting vacation:', err);
      
      await logSecurityEvent(
        'vacation_delete_error',
        'Error occurred during vacation deletion',
        { 
          vacation_id: vacation.id,
          error: String(err),
          user_id: user?.id 
        },
        'error'
      );
      
      toast({
        title: t('common.error'),
        description: t('vacation.deleteError'),
        variant: "destructive",
      });
      return false;
    }
  };

  // Approve vacation with security checks
  const approveVacation = async (vacation: Vacation, notes?: string) => {
    if (!isAdmin && !isSkadeleder) {
      await logSecurityEvent(
        'vacation_unauthorized_approval',
        'User attempted to approve vacation without proper role',
        { vacation_id: vacation.id, user_role: user?.role },
        'warning'
      );
      
      toast({
        title: t('common.error'),
        description: 'You do not have permission to approve vacation requests',
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) {
        if (error.message.includes('row-level security policy')) {
          await logSecurityEvent(
            'vacation_rls_violation',
            'Vacation approval blocked by RLS policy',
            { vacation_id: vacation.id, error_message: error.message },
            'warning'
          );
          
          toast({
            title: t('common.error'),
            description: 'Access denied: Cannot approve this vacation request',
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }
      
      // Log the approval
      await logVacationSecurityEvent('approved', vacation.id, {
        approved_by: user?.id,
        notes: notes
      });
      
      // Refresh vacation data
      await refreshVacations();
      
      // Show success message
      toast({
        title: t('vacation.requestApproved'),
        description: t('vacation.requestApprovedMsg', { name: vacation.user?.name || 'Employee' }),
      });
      
      // Notify the employee
      if (vacation.user_id) {
        const notifyMessage = vacation.request_type === 'partial_day' && vacation.start_time && vacation.end_time
          ? t('vacation.partialDayApproved', { 
              startTime: vacation.start_time,
              endTime: vacation.end_time
            })
          : t('vacation.yourRequestApproved');
        
        await addNotification({
          type: 'vacation',
          title: t('vacation.vacationApproved'),
          message: notifyMessage,
          link: '/vacation',
          targetUserId: vacation.user_id
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error approving vacation:', err);
      
      await logSecurityEvent(
        'vacation_approval_error',
        'Error occurred during vacation approval',
        { 
          vacation_id: vacation.id,
          error: String(err),
          user_id: user?.id 
        },
        'error'
      );
      
      toast({
        title: t('common.error'),
        description: 'Failed to approve vacation request',
        variant: "destructive",
      });
      return false;
    }
  };

  // Reject vacation with security checks
  const rejectVacation = async (vacation: Vacation, reason?: string) => {
    if (!isAdmin && !isSkadeleder) {
      await logSecurityEvent(
        'vacation_unauthorized_rejection',
        'User attempted to reject vacation without proper role',
        { vacation_id: vacation.id, user_role: user?.role },
        'warning'
      );
      
      toast({
        title: t('common.error'),
        description: 'You do not have permission to reject vacation requests',
        variant: "destructive",
      });
      return false;
    }
    
    if (!reason) {
      toast({
        title: t('common.error'),
        description: t('vacation.rejectionReasonRequired'),
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) {
        if (error.message.includes('row-level security policy')) {
          await logSecurityEvent(
            'vacation_rls_violation',
            'Vacation rejection blocked by RLS policy',
            { vacation_id: vacation.id, error_message: error.message },
            'warning'
          );
          
          toast({
            title: t('common.error'),
            description: 'Access denied: Cannot reject this vacation request',
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }
      
      // Log the rejection
      await logVacationSecurityEvent('rejected', vacation.id, {
        rejected_by: user?.id,
        reason: reason
      });
      
      // Refresh vacation data
      await refreshVacations();
      
      // Show success message
      toast({
        title: t('vacation.requestRejected'),
        description: t('vacation.requestRejectedMsg', { name: vacation.user?.name || 'Employee' }),
      });
      
      // Notify the employee
      if (vacation.user_id) {
        const notifyMessage = vacation.request_type === 'partial_day' && vacation.start_time && vacation.end_time
          ? t('vacation.partialDayRejected', { 
              startTime: vacation.start_time,
              endTime: vacation.end_time
            })
          : t('vacation.yourRequestRejected', { reason });
        
        await addNotification({
          type: 'vacation',
          title: t('vacation.vacationStatusChanged'),
          message: notifyMessage,
          link: '/vacation',
          targetUserId: vacation.user_id
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error rejecting vacation:', err);
      
      await logSecurityEvent(
        'vacation_rejection_error',
        'Error occurred during vacation rejection',
        { 
          vacation_id: vacation.id,
          error: String(err),
          user_id: user?.id 
        },
        'error'
      );
      
      toast({
        title: t('common.error'),
        description: 'Failed to reject vacation request',
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    submitVacationRequest,
    editVacation,
    deleteVacation,
    approveVacation,
    rejectVacation,
    isSubmitting
  };
};
