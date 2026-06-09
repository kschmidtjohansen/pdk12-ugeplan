
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';
import { useNotifications } from '@/context/NotificationContext';
import { useQueryClient } from '@tanstack/react-query';

export const useVacationApprovalActions = (
  fetchVacations: () => Promise<void>
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Approve vacation request
  const approveVacation = async (vacation: Vacation, note?: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      
      // Update the vacation status in the database
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: note || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Auto-remove employee from any overlapping assignments
      let cleanupSummary = '';
      try {
        const { data: cleanup, error: cleanupErr } = await supabase.functions.invoke(
          'vacation-cleanup-assignments',
          { body: { vacationId: vacation.id } }
        );
        if (cleanupErr) {
          if (import.meta.env.DEV) console.warn('[approveVacation] cleanup error:', cleanupErr);
        } else if (cleanup) {
          const removed = (cleanup as any).removedFromCount || 0;
          const cleared = (cleanup as any).clearedResponsibleCount || 0;
          if (removed > 0 || cleared > 0) {
            const parts: string[] = [];
            if (removed > 0) parts.push(t('vacation.autoUnassignSuccess', { count: String(removed) }));
            if (cleared > 0) parts.push(t('vacation.autoUnassignResponsibleCleared', { count: String(cleared) }));
            cleanupSummary = ' ' + parts.join(' ');
            // Refresh assignments so UI updates immediately
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['optimizedAssignments'] });
          }
        }
      } catch (cleanupErr) {
        if (import.meta.env.DEV) console.warn('[approveVacation] cleanup invocation failed:', cleanupErr);
      }
      
      // Refresh vacation data
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      await fetchVacations();
      
      // Show success toast
      toast({
        title: t('vacation.requestApproved'),
        description: t('vacation.requestApprovedMsg', { name: vacation.user?.name || 'Unknown' }) + cleanupSummary,
      });
      
      // Notify the employee
      await addNotification({
        type: 'vacation',
        title: t('vacation.vacationApproved'),
        message: t('vacation.yourRequestApproved'),
        link: '/vacation',
        targetUserId: vacation.user_id
      });
      
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error approving vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to approve vacation request',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reject vacation request
  const rejectVacation = async (vacation: Vacation, reason: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      
      // Update the vacation status in the database
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Refresh vacation data
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      await fetchVacations();
      
      // Show success toast
      toast({
        title: t('vacation.requestRejected'),
        description: t('vacation.requestRejectedMsg', { name: vacation.user?.name || 'Unknown' }),
      });
      
      // Notify the employee
      await addNotification({
        type: 'vacation',
        title: t('vacation.vacationStatusChanged'),
        message: t('vacation.yourRequestRejected', { reason: reason }),
        link: '/vacation',
        targetUserId: vacation.user_id
      });
      
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error rejecting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to reject vacation request',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    approveVacation,
    rejectVacation
  };
};
