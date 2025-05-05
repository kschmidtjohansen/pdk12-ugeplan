
import { useState } from 'react';
import { format } from 'date-fns';
import { Vacation } from '../types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { DateRange } from 'react-day-picker';

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
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  const [vacations, setVacations] = useState<Vacation[]>(initialVacations);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const submitVacationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.from || !date.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return false;
    }
    
    const newVacation: Vacation = {
      id: Date.now().toString(),
      employeeId: user?.id || '',
      employeeName: user?.name || '',
      startDate: date.from,
      endDate: date.to,
      reason,
      status: 'pending',
      createdAt: new Date()
    };
    
    setVacations([...vacations, newVacation]);
    toast({
      title: t("vacation.requestSubmitted"),
      description: t("vacation.requestSent")
    });

    // Generate notification for administrators
    if (user?.role !== 'administrator') {
      const formattedStartDate = format(date.from, 'dd/MM/yyyy');
      const formattedEndDate = format(date.to, 'dd/MM/yyyy');
      addNotification({
        type: 'vacation',
        title: t("notifications.newVacationRequest"),
        message: t("notifications.newVacationRequestMsg", {
          name: user?.name,
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
  };

  return {
    vacations,
    date,
    setDate,
    reason,
    setReason,
    note,
    setNote,
    submitVacationRequest,
    approveVacation,
    rejectVacation
  };
};
