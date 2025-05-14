
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';

export const useVacationEditing = (fetchVacations: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const editVacation = async (
    vacation: Vacation, 
    startDate: Date,
    endDate: Date,
    reason: string
  ) => {
    try {
      // For non-admin users, only allow editing pending vacations
      if (!isAdmin && vacation.status !== 'pending') {
        toast({
          title: t('common.error'),
          description: t('vacation.cannotEditNonPending'),
          variant: 'destructive',
        });
        return false;
      }
      
      // For admins, show a toast explaining their special ability
      if (isAdmin && vacation.status !== 'pending') {
        toast({
          title: t('common.info'),
          description: t('vacation.adminCanEditAll'),
        });
      }
      
      const { error } = await supabase
        .from('vacations')
        .update({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Display toast notification
      toast({
        title: t('vacation.requestUpdated'),
        description: t('vacation.requestUpdatedMsg'),
      });
      
      // Refresh vacation list
      fetchVacations();
      return true;
    } catch (err) {
      console.error('Error editing vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    editVacation
  };
};
