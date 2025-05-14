
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';

export const useVacationDeletion = (fetchVacations: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const deleteVacation = async (vacation: Vacation) => {
    try {
      // For non-admin users, only allow deleting pending vacations
      if (!isAdmin && vacation.status !== 'pending') {
        toast({
          title: t('common.error'),
          description: t('vacation.cannotDeleteNonPending'),
          variant: 'destructive',
        });
        return false;
      }
      
      // For admins, show a toast explaining their special ability
      if (isAdmin && vacation.status !== 'pending') {
        toast({
          title: t('common.info'),
          description: t('vacation.adminCanDeleteAll'),
        });
      }
      
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Display toast notification
      toast({
        title: t('vacation.requestDeleted'),
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
      
      // Refresh vacation list
      fetchVacations();
      return true;
    } catch (err) {
      console.error('Error deleting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    deleteVacation
  };
};
