
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '@/types/vacation';
import { DateRange } from 'react-day-picker';

interface UseVacationEditStateProps {
  vacations: Vacation[];
  fetchVacations: () => Promise<void>;
  date: DateRange;
  setDate: (date: DateRange) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  reason: string;
  setReason: (reason: string) => void;
  resetFormState: () => void;
}

export const useVacationEditState = ({
  vacations,
  fetchVacations,
  date,
  setDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  reason,
  setReason,
  resetFormState
}: UseVacationEditStateProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  
  // Prepare vacation for editing
  const prepareVacationForEdit = (vacation: Vacation) => {
    setSelectedVacation(vacation);
    
    setDate({
      from: vacation.startDate,
      to: vacation.endDate,
    });
    
    // Also set the individual dates
    setStartDate(vacation.startDate);
    setEndDate(vacation.endDate);
    setReason(vacation.reason);
    setEditDialogOpen(true);
  };
  
  // Submit edit handler
  const submitEditVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacation) return;
    
    // Use either the individual dates or the combined date range
    const editStartDate = startDate || date.from;
    const editEndDate = endDate || date.to;
    
    if (!editStartDate || !editEndDate) return;
    
    try {
      // Update the vacation in the database
      const { error } = await supabase
        .from('vacations')
        .update({
          start_date: editStartDate.toISOString().split('T')[0],
          end_date: editEndDate.toISOString().split('T')[0],
          reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVacation.id);
      
      if (error) throw error;
      
      // Display toast notification
      toast({
        title: t('vacation.requestUpdated'),
        description: t('vacation.requestUpdatedMsg'),
      });
      
      // Refresh vacation list
      await fetchVacations();
      
      // Reset state and close dialog
      setEditDialogOpen(false);
      resetFormState();
      setSelectedVacation(null);
      
    } catch (err) {
      console.error('Error editing vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating vacation request',
        variant: 'destructive',
      });
    }
  };
  
  return {
    editDialogOpen,
    setEditDialogOpen,
    selectedVacation,
    setSelectedVacation,
    prepareVacationForEdit,
    submitEditVacation,
  };
};
