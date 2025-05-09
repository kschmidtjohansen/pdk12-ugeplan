
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Vacation, VacationStatus } from '../types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { DateRange } from 'react-day-picker';
import { useEmployees } from './useEmployees';
import { supabase } from '@/integrations/supabase/client';

export const useVacations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const { employees } = useEmployees();
  
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch vacations from Supabase
  const fetchVacations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all vacations with employee names
      const { data, error } = await supabase
        .from('vacations')
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          reason,
          status,
          notes,
          created_at,
          updated_at,
          profiles:user_id (name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedVacations: Vacation[] = data.map(item => ({
          id: item.id,
          employeeId: item.user_id,
          employeeName: item.profiles?.name || 'Unknown',
          startDate: new Date(item.start_date),
          endDate: new Date(item.end_date),
          reason: item.reason || '',
          status: item.status as VacationStatus,
          notes: item.notes || '',
          createdAt: new Date(item.created_at)
        }));
        
        setVacations(formattedVacations);
      }
    } catch (err) {
      console.error('Error fetching vacations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vacations');
      toast({
        title: t('common.error'),
        description: t('vacation.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load vacations on component mount
  useEffect(() => {
    fetchVacations();
  }, []);
  
  // Subscribe to vacation changes
  useEffect(() => {
    const channel = supabase
      .channel('vacation_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacations'
        },
        () => {
          fetchVacations(); // Refresh when changes occur
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submitVacationRequest = async (e: React.FormEvent, isAdminRequest: boolean = false) => {
    e.preventDefault();
    if (!date.from || !date.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }
    
    // Make sure we have a user ID
    if (!user?.id) {
      toast({
        title: t("common.error"),
        description: t("common.authRequired"),
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Determine whose vacation is being requested
      let requestEmployeeId = user.id;
      let requestEmployeeName = user.name;
      
      // If admin is making request for someone else
      if (isAdminRequest && selectedEmployeeId) {
        const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
        if (selectedEmployee) {
          requestEmployeeId = selectedEmployee.id;
          requestEmployeeName = selectedEmployee.name;
        } else {
          toast({
            title: t("vacation.error"),
            description: t("vacation.employeeNotFound"),
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Create the vacation record
      const { data, error } = await supabase
        .from('vacations')
        .insert([
          {
            user_id: requestEmployeeId,
            start_date: date.from.toISOString(),
            end_date: date.to.toISOString(),
            reason: reason,
            status: 'pending'
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Different toast messages based on whether admin is making request for someone else
      if (isAdminRequest && user.id !== requestEmployeeId) {
        toast({
          title: t("vacation.adminRequestSubmitted"),
          description: t("vacation.adminRequestSent", { name: requestEmployeeName })
        });
        
        // Notify the employee that an admin has made a vacation request for them
        addNotification({
          type: 'vacation',
          title: t("vacation.requestSubmittedForYou"),
          message: t("vacation.adminRequestedForYou", {
            adminName: user.name,
            from: format(date.from, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'),
            to: format(date.to, currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')
          }),
          link: '/vacation'
        });
      } else {
        toast({
          title: t("vacation.requestSubmitted"),
          description: t("vacation.requestSent")
        });
      }

      // Generate notification for administrators
      if (user.role !== 'administrator') {
        const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
        const formattedStartDate = format(date.from, dateFormat);
        const formattedEndDate = format(date.to, dateFormat);
        addNotification({
          type: 'vacation',
          title: t("notifications.newVacationRequest"),
          message: t("notifications.newVacationRequestMsg", {
            name: requestEmployeeName,
            from: formattedStartDate,
            to: formattedEndDate
          }),
          link: '/vacation'
        });
      }
      
      // Refresh the vacation list
      fetchVacations();
      
      // Reset form
      setDate({ from: undefined, to: undefined });
      setReason('');
      
      return true;
    } catch (err) {
      console.error('Error submitting vacation request:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error submitting vacation request',
        variant: 'destructive',
      });
      return false;
    }
  };

  const approveVacation = async (vacation: Vacation, noteText: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'approved',
          notes: noteText || null
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Update local state
      setVacations(vacations.map(v => {
        if (v.id === vacation.id) {
          return {
            ...v,
            status: 'approved',
            notes: noteText || undefined
          };
        }
        return v;
      }));
      
      toast({
        title: t("vacation.requestApproved"),
        description: t("vacation.requestApprovedMsg", { name: vacation.employeeName })
      });
      
      // Notify the employee about their approved vacation request
      if (vacation.employeeId !== user?.id) {
        addNotification({
          type: 'vacation',
          title: t("vacation.requestApproved"),
          message: t("vacation.yourRequestApproved"),
          link: '/vacation'
        });
      }
    } catch (err) {
      console.error('Error approving vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error approving vacation',
        variant: 'destructive',
      });
    }
  };

  const rejectVacation = async (vacation: Vacation, noteText: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejected',
          notes: noteText || null
        })
        .eq('id', vacation.id);
      
      if (error) throw error;
      
      // Update local state
      setVacations(vacations.map(v => {
        if (v.id === vacation.id) {
          return {
            ...v,
            status: 'rejected',
            notes: noteText || undefined
          };
        }
        return v;
      }));
      
      toast({
        title: t("vacation.requestRejected"),
        description: t("vacation.requestRejectedMsg", { name: vacation.employeeName })
      });
      
      // Notify the employee about their rejected vacation request
      if (vacation.employeeId !== user?.id) {
        addNotification({
          type: 'vacation',
          title: t("vacation.requestRejected"),
          message: t("vacation.yourRequestRejected", { reason: noteText }),
          link: '/vacation'
        });
      }
    } catch (err) {
      console.error('Error rejecting vacation:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error rejecting vacation',
        variant: 'destructive',
      });
    }
  };

  return {
    vacations,
    loading,
    error,
    date,
    setDate,
    reason,
    setReason,
    note,
    setNote,
    dialogOpen,
    setDialogOpen,
    adminDialogOpen,
    setAdminDialogOpen,
    selectedEmployeeId,
    setSelectedEmployeeId,
    submitVacationRequest,
    approveVacation,
    rejectVacation
  };
};
