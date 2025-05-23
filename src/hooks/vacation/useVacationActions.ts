
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { useVacationRequestActions } from './useVacationRequestActions';
import { Vacation } from '@/types/vacation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { submitVacationRequest } = useVacationRequestActions(fetchVacations);
  const { isAdmin, user } = useAuth();

  const approveVacation = async (vacation: Vacation, note: string = '') => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: note || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;

      // Display toast notification
      toast(t('vacation.requestApproved'), {
        description: t('vacation.requestApprovedMsg', { name: vacation.employeeName })
      });

      // Add notification for the employee
      addNotification({
        type: 'vacation',
        title: t('notifications.vacationStatusChanged'),
        message: t('notifications.vacationApproved'),
        link: '/vacation',
        targetUserId: vacation.employeeId
      });
      
      // After approval, update employee leave status if vacation starts today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(vacation.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate.getTime() <= today.getTime()) {
        await supabase
          .from('profiles')
          .update({
            on_leave: true
          })
          .eq('id', vacation.employeeId);
      }
      
      // Refresh vacation list
      fetchVacations();

    } catch (err) {
      console.error('Error approving vacation:', err);
      toast(t('common.error'), {
        description: err instanceof Error ? err.message : 'Error approving vacation request',
      });
    }
  };

  const rejectVacation = async (vacation: Vacation, reason: string) => {
    if (!reason.trim()) {
      toast(t('common.error'), {
        description: t('vacation.rejectionReasonRequired'),
      });
      return;
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
      
      if (error) throw error;

      // Display toast notification
      toast(t('vacation.requestRejected'), {
        description: t('vacation.requestRejectedMsg', { name: vacation.employeeName })
      });

      // Add notification for the employee
      addNotification({
        type: 'vacation',
        title: t('notifications.vacationStatusChanged'),
        message: t('notifications.vacationRejected', { reason }),
        link: '/vacation',
        targetUserId: vacation.employeeId
      });
      
      // Refresh vacation list
      fetchVacations();

    } catch (err) {
      console.error('Error rejecting vacation:', err);
      toast(t('common.error'), {
        description: err instanceof Error ? err.message : 'Error rejecting vacation request',
      });
    }
  };

  const editVacation = async (
    vacation: Vacation, 
    startDate: Date,
    endDate: Date,
    reason: string
  ) => {
    try {
      console.log("Editing vacation:", vacation.id);
      console.log("Start date:", startDate);
      console.log("End date:", endDate);
      console.log("User role - isAdmin:", isAdmin);
      
      // Ensure we have valid date objects
      if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        throw new Error("Invalid start date provided");
      }
      
      if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        throw new Error("Invalid end date provided");
      }
      
      // Normalize dates to mitigate timezone issues by setting time to noon UTC
      startDate = new Date(startDate);
      startDate.setHours(12, 0, 0, 0);
      
      endDate = new Date(endDate);
      endDate.setHours(12, 0, 0, 0);
      
      // Format dates correctly - ensuring we're using YYYY-MM-DD format for Supabase
      // Use EXACTLY the column names in the database: start_date and end_date
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log("Formatted data to be sent:", {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        reason
      });
      
      // Update the vacation record in Supabase - use the correct column names
      const { error, data } = await supabase
        .from('vacations')
        .update({
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id)
        .select('*');
      
      console.log("Update response:", { error, data });
      
      if (error) {
        console.error("Error from Supabase:", error);
        toast(t('common.error'), {
          description: error.message || t('vacation.editError'),
        });
        return false;
      }
      
      // Display toast notification
      toast(t('vacation.requestUpdated'), {
        description: t('vacation.requestUpdatedMsg')
      });
      
      // Refresh vacation list to show the updated data
      await fetchVacations();
      
      return true;
    } catch (err) {
      console.error('Error editing vacation:', err);
      toast(t('common.error'), {
        description: err instanceof Error ? err.message : 'Error updating vacation request',
      });
      return false;
    }
  };
  
  const deleteVacation = async (vacation: Vacation) => {
    try {
      console.log("Starting deletion process for vacation:", vacation.id);
      
      // With our new RLS policies in place, this will only succeed if:
      // 1. The authenticated user is an administrator, or
      // 2. The authenticated user is deleting their own vacation record  
      const { error, data } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacation.id)
        .select();
      
      if (error) {
        console.error("Error during vacation deletion:", error);
        toast(t('common.error'), {
          description: error.message || t('vacation.deleteError'),
        });
        return false;
      }
      
      console.log("Vacation deleted successfully:", vacation.id, "Response data:", data);
      
      // Display toast notification
      toast(t('vacation.requestDeleted'), {
        description: t('vacation.requestDeletedMsg'),
      });

      // If deleting an approved vacation and the employee is on leave because of it,
      // check if they should be marked as available again
      if (vacation.status === 'approved') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDate = new Date(vacation.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(vacation.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        if (today >= startDate && today <= endDate) {
          // Check if there are any other active vacations for this employee
          const { data: otherVacations } = await supabase
            .from('vacations')
            .select('*')
            .eq('user_id', vacation.employeeId)
            .eq('status', 'approved')
            .lte('start_date', today.toISOString().split('T')[0])
            .gte('end_date', today.toISOString().split('T')[0])
            .neq('id', vacation.id);
          
          // If no other active vacations, mark as available
          if (!otherVacations || otherVacations.length === 0) {
            await supabase
              .from('profiles')
              .update({
                on_leave: false
              })
              .eq('id', vacation.employeeId);
          }
        }
      }
      
      // Update the local vacations state to ensure UI updates immediately
      await fetchVacations();
      
      return true;
      
    } catch (err) {
      console.error('Error deleting vacation:', err);
      toast(t('common.error'), {
        description: err instanceof Error ? err.message : t('vacation.deleteError'),
      });
      return false;
    }
  };

  return {
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    editVacation,
    deleteVacation
  };
};
