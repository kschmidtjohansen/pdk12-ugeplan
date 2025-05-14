
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';

interface UseVacationDeleteStateProps {
  fetchVacations: () => Promise<void>;
  selectedVacation: Vacation | null;
  setSelectedVacation: (vacation: Vacation | null) => void;
  setEditDialogOpen: (open: boolean) => void;
}

export const useVacationDeleteState = ({
  fetchVacations,
  selectedVacation,
  setSelectedVacation,
  setEditDialogOpen
}: UseVacationDeleteStateProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  // Delete vacation handler
  const handleDeleteVacation = (vacation: Vacation) => {
    console.log("Setting up vacation for deletion:", vacation.id);
    setSelectedVacation(vacation);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete handler
  const confirmDeleteVacation = async () => {
    if (!selectedVacation) {
      console.error("No vacation selected for deletion");
      return;
    }
    
    console.log("Confirming deletion of vacation:", selectedVacation.id);
    
    try {
      // Call the deleteVacation function
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', selectedVacation.id);
      
      if (error) {
        console.error("Error during vacation deletion:", error);
        toast({
          title: t('common.error'),
          description: error.message || t('vacation.deleteError'),
          variant: 'destructive',
        });
        return false;
      }
      
      console.log("Vacation successfully deleted:", selectedVacation.id);
      
      // If deleting an approved vacation and the employee is on leave because of it,
      // check if they should be marked as available again
      if (selectedVacation.status === 'approved') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDate = new Date(selectedVacation.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedVacation.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        if (today >= startDate && today <= endDate) {
          // Check if there are any other active vacations for this employee
          const { data: otherVacations } = await supabase
            .from('vacations')
            .select('*')
            .eq('user_id', selectedVacation.employeeId)
            .eq('status', 'approved')
            .lte('start_date', today.toISOString().split('T')[0])
            .gte('end_date', today.toISOString().split('T')[0])
            .neq('id', selectedVacation.id);
          
          // If no other active vacations, mark as available
          if (!otherVacations || otherVacations.length === 0) {
            await supabase
              .from('profiles')
              .update({
                on_leave: false
              })
              .eq('id', selectedVacation.employeeId);
          }
        }
      }
      
      // Display toast notification
      toast({
        title: t('vacation.requestDeleted'),
        description: t('vacation.requestDeletedMsg'),
      });
      
      // Close the dialog and reset state
      setDeleteDialogOpen(false);
      setSelectedVacation(null);
      
      // Update the local vacations state
      await fetchVacations();
      
      return true;
      
    } catch (err) {
      console.error('Error deleting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('vacation.deleteError'),
        variant: 'destructive',
      });
      return false;
    }
  };

  // Handle delete from the edit dialog
  const handleDeleteCurrentVacation = () => {
    if (selectedVacation) {
      setDeleteDialogOpen(true);
      setEditDialogOpen(false);
    }
  };
  
  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteVacation,
    confirmDeleteVacation,
    handleDeleteCurrentVacation,
  };
};
