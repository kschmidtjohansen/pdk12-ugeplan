
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Vacation } from '../types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { DateRange } from 'react-day-picker';
import { useEmployees } from './useEmployees';

export const useVacations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const { employees } = useEmployees();
  
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchVacations();

    // Set up real-time subscription for vacation updates
    const vacationSubscription = supabase
      .channel('public:vacations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vacations' }, 
        fetchVacations
      )
      .subscribe();

    return () => {
      vacationSubscription.unsubscribe();
    };
  }, [user]);

  const fetchVacations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*');

      if (error) {
        throw error;
      }

      // Transform to application format
      const vacationsData: Vacation[] = data.map(v => ({
        id: v.id,
        employeeId: v.employee_id,
        employeeName: v.employee_name,
        startDate: new Date(v.start_date),
        endDate: new Date(v.end_date),
        reason: v.reason || '',
        status: v.status,
        notes: v.notes || '',
        createdAt: new Date(v.created_at)
      }));

      setVacations(vacationsData);
    } catch (error) {
      console.error("Error fetching vacations:", error);
      toast({
        title: t("common.error"),
        description: t("vacation.fetchError"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const submitVacationRequest = async (e: React.FormEvent, isAdminRequest: boolean = false) => {
    e.preventDefault();
    if (!date.from || !date.to || !user) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }
    
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
    
    try {
      const { error } = await supabase
        .from('vacations')
        .insert({
          employee_id: requestEmployeeId,
          employee_name: requestEmployeeName,
          start_date: date.from.toISOString().split('T')[0],
          end_date: date.to.toISOString().split('T')[0],
          reason,
          status: 'pending'
        });

      if (error) {
        throw error;
      }
      
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
      
      fetchVacations();
      return true;
    } catch (error) {
      console.error("Error submitting vacation request:", error);
      toast({
        title: t("common.error"),
        description: t("vacation.submitError"),
        variant: "destructive"
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

      if (error) {
        throw error;
      }
      
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
      
      fetchVacations();
    } catch (error) {
      console.error("Error approving vacation:", error);
      toast({
        title: t("common.error"),
        description: t("vacation.approveError"),
        variant: "destructive"
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

      if (error) {
        throw error;
      }
      
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
      
      fetchVacations();
    } catch (error) {
      console.error("Error rejecting vacation:", error);
      toast({
        title: t("common.error"),
        description: t("vacation.rejectError"),
        variant: "destructive"
      });
    }
  };

  return {
    vacations,
    isLoading,
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
    rejectVacation,
    fetchVacations
  };
};
