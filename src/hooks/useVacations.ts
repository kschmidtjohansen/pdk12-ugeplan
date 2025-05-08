
import { useState } from 'react';
import { format } from 'date-fns';
import { Vacation } from '../types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { DateRange } from 'react-day-picker';
import { useEmployees } from './useEmployees';

// Mock data
const initialVacations: Vacation[] = [{
  id: '1',
  employeeId: '1',
  employeeName: 'John Doe',
  startDate: new Date('2025-05-15'),
  endDate: new Date('2025-05-20'),
  reason: 'Annual leave',
  status: 'approved',
  createdAt: new Date('2025-04-01')
}, {
  id: '2',
  employeeId: '2',
  employeeName: 'Jane Smith',
  startDate: new Date('2025-06-10'),
  endDate: new Date('2025-06-15'),
  reason: 'Family vacation',
  status: 'pending',
  createdAt: new Date('2025-04-15')
}, {
  id: '3',
  employeeId: '3',
  employeeName: 'Mike Johnson',
  startDate: new Date('2025-07-05'),
  endDate: new Date('2025-07-12'),
  reason: 'Summer holiday',
  status: 'rejected',
  createdAt: new Date('2025-04-20'),
  notes: 'Too many people already on vacation during this period'
}];

export const useVacations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const { employees } = useEmployees();
  
  const [vacations, setVacations] = useState<Vacation[]>(initialVacations);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const submitVacationRequest = (e: React.FormEvent, isAdminRequest: boolean = false) => {
    e.preventDefault();
    if (!date.from || !date.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }
    
    // Determine whose vacation is being requested
    let requestEmployeeId = user?.id || '';
    let requestEmployeeName = user?.name || '';
    
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
    
    const newVacation: Vacation = {
      id: Date.now().toString(),
      employeeId: requestEmployeeId,
      employeeName: requestEmployeeName,
      startDate: date.from,
      endDate: date.to,
      reason,
      status: 'pending',
      createdAt: new Date()
    };
    
    setVacations([...vacations, newVacation]);
    
    // Different toast messages based on whether admin is making request for someone else
    if (isAdminRequest && user?.id !== requestEmployeeId) {
      toast({
        title: t("vacation.adminRequestSubmitted"),
        description: t("vacation.adminRequestSent", { name: requestEmployeeName })
      });
      
      // Notify the employee that an admin has made a vacation request for them
      addNotification({
        type: 'vacation',
        title: t("vacation.requestSubmittedForYou"),
        message: t("vacation.adminRequestedForYou", {
          adminName: user?.name,
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
  };

  const approveVacation = (vacation: Vacation, noteText: string) => {
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
  };

  const rejectVacation = (vacation: Vacation, noteText: string) => {
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
    rejectVacation
  };
};
