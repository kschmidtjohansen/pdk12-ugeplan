
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Vacation } from '../types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { DateRange } from 'react-day-picker';
import { useEmployees } from './useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { InsertVacation, TableVacation } from '@/types/supabase';

export const useVacations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const { employees } = useEmployees();
  
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch vacations from Supabase
  useEffect(() => {
    const fetchVacations = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('vacations')
          .select(`
            *,
            profiles:profile_id(name)
          `);

        if (error) {
          throw error;
        }

        // Transform data to match our Vacation interface
        const transformedVacations: Vacation[] = data.map((v: any) => ({
          id: v.id,
          employeeId: v.profile_id,
          employeeName: v.profiles.name,
          startDate: new Date(v.start_date),
          endDate: new Date(v.end_date),
          reason: v.reason,
          status: v.status,
          notes: v.notes,
          createdAt: new Date(v.created_at)
        }));

        setVacations(transformedVacations);
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

    fetchVacations();
  }, [toast, t]);

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
    let requestEmployeeId = user.id || '';
    let requestEmployeeName = user.name || '';
    
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
      // Prepare vacation data for Supabase
      const vacationData: InsertVacation = {
        profile_id: requestEmployeeId,
        start_date: date.from.toISOString().split('T')[0],
        end_date: date.to.toISOString().split('T')[0],
        reason: reason,
        status: 'pending',
        notes: note || null
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('vacations')
        .insert(vacationData)
        .select(`
          *,
          profiles:profile_id(name)
        `);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Transform to our Vacation interface
        const newVacation: Vacation = {
          id: data[0].id,
          employeeId: data[0].profile_id,
          employeeName: data[0].profiles.name,
          startDate: new Date(data[0].start_date),
          endDate: new Date(data[0].end_date),
          reason: data[0].reason,
          status: data[0].status,
          notes: data[0].notes,
          createdAt: new Date(data[0].created_at)
        };

        // Update local state
        setVacations([...vacations, newVacation]);
      }
      
      // Different toast messages based on whether admin is making request for someone else
      if (isAdminRequest && user.id !== requestEmployeeId) {
        toast({
          title: t("vacation.adminRequestSubmitted"),
          description: t("vacation.adminRequestSent", { name: requestEmployeeName })
        });
        
        // Notify the employee that an admin has made a vacation request for them
        // Note: In a real implementation, we'd store this in the notifications table
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
      if (user?.role !== 'administrator') {
        const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
        const formattedStartDate = format(date.from, dateFormat);
        const formattedEndDate = format(date.to, dateFormat);
        
        // Note: In a real implementation, we'd store this in the notifications table
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
      
      return true;
    } catch (error) {
      console.error('Error submitting vacation request:', error);
      toast({
        title: t('common.error'),
        description: t('vacation.submitError'),
        variant: "destructive",
      });
      return false;
    }
  };

  const approveVacation = async (vacation: Vacation, noteText: string) => {
    try {
      // Update in Supabase
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
      if (user && vacation.employeeId !== user.id) {
        // Note: In a real implementation, we'd store this in the notifications table
        addNotification({
          type: 'vacation',
          title: t("vacation.requestApproved"),
          message: t("vacation.yourRequestApproved"),
          link: '/vacation'
        });
      }
    } catch (error) {
      console.error('Error approving vacation:', error);
      toast({
        title: t('common.error'),
        description: t('vacation.approveError'),
        variant: "destructive",
      });
    }
  };

  const rejectVacation = async (vacation: Vacation, noteText: string) => {
    try {
      // Update in Supabase
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
      if (user && vacation.employeeId !== user.id) {
        // Note: In a real implementation, we'd store this in the notifications table
        addNotification({
          type: 'vacation',
          title: t("vacation.requestRejected"),
          message: t("vacation.yourRequestRejected", { reason: noteText }),
          link: '/vacation'
        });
      }
    } catch (error) {
      console.error('Error rejecting vacation:', error);
      toast({
        title: t('common.error'),
        description: t('vacation.rejectError'),
        variant: "destructive",
      });
    }
  };

  return {
    vacations,
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
    isLoading
  };
};
