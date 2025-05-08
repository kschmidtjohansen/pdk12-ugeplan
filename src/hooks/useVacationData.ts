
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/context/TranslationContext";
import { Vacation, VacationStatus } from "@/types/vacation";
import { fetchVacations, updateVacationStatus } from "@/services/vacationService";

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionVacation, setActionVacation] = useState<Vacation | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  // Fetch vacations from Supabase
  useEffect(() => {
    const loadVacations = async () => {
      try {
        setIsLoading(true);
        const data = await fetchVacations();
        setVacations(data);
      } catch (error) {
        console.error('Error fetching vacations:', error);
        toast({
          title: t('common.error'),
          description: t('vacation.fetchError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadVacations();
  }, [toast, t]);

  // Add new vacation to the state
  const addVacation = (vacation: Vacation) => {
    setVacations([...vacations, vacation]);
  };

  // Handlers for vacation actions (approve/reject)
  const handleApproveClick = (vacation: Vacation) => {
    setActionVacation(vacation);
    setNoteDialogOpen(true);
  };

  const handleRejectClick = (vacation: Vacation) => {
    setActionVacation({
      ...vacation,
      status: 'rejected'
    });
    setNoteDialogOpen(true);
  };

  // Update vacation status in the state
  const updateVacationInState = (vacationId: string, status: VacationStatus, notes?: string) => {
    setVacations(vacations.map(v => {
      if (v.id === vacationId) {
        return {
          ...v,
          status: status,
          notes: notes || v.notes
        };
      }
      return v;
    }));
  };

  return {
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
  };
};
