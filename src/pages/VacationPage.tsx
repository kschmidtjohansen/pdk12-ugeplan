import React, { useState } from 'react';
import { format } from 'date-fns';
import PageHeader from '../components/Layout/PageHeader';
import { useAuth, usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Vacation } from '../types/vacation';

// Import refactored vacation components
import VacationTabs from '../components/Vacation/VacationTabs';
import VacationList from '../components/Vacation/VacationList';
import VacationFormDialog from '../components/Vacation/VacationFormDialog';
import VacationActionDialog from '../components/Vacation/VacationActionDialog';

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

const VacationPage: React.FC = () => {
  const { user } = useAuth();
  const { canApproveVacation, canViewAllVacations, isServicemedarbejder } = usePermissions();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  const [vacations, setVacations] = useState(initialVacations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState(isServicemedarbejder ? 'mine' : 'all');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [actionVacation, setActionVacation] = useState<Vacation | null>(null);
  const [note, setNote] = useState('');

  const handleCreateNew = () => {
    setDate({
      from: undefined,
      to: undefined
    });
    setReason('');
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.from || !date.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive"
      });
      return;
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
    
    setDialogOpen(false);
  };

  const handleApproveClick = (vacation: Vacation) => {
    setActionVacation(vacation);
    setNote('');
    setNoteDialogOpen(true);
  };

  const handleRejectClick = (vacation: Vacation) => {
    setActionVacation({
      ...vacation,
      status: 'rejected'
    });
    setNote('');
    setNoteDialogOpen(true);
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionVacation) return;
    
    setVacations(vacations.map(v => {
      if (v.id === actionVacation.id) {
        return {
          ...v,
          status: actionVacation.status === 'rejected' ? 'rejected' : 'approved',
          notes: note || undefined
        };
      }
      return v;
    }));
    
    toast({
      title: actionVacation.status === 'rejected' ? 
        t("vacation.requestRejected") : 
        t("vacation.requestApproved"),
      description: t(
        actionVacation.status === 'rejected' ? 
          "vacation.requestRejectedMsg" : 
          "vacation.requestApprovedMsg", 
        { name: actionVacation.employeeName }
      )
    });
    
    setNoteDialogOpen(false);
  };

  const filteredVacations = vacations.filter(v => {
    if (activeTab === 'approved') return v.status === 'approved';
    if (activeTab === 'pending') return v.status === 'pending';
    if (activeTab === 'mine') return v.employeeId === user?.id;
    return true;
  });

  return (
    <>
      <PageHeader 
        title={t("navigation.vacation")} 
        description={t("vacation.pageDescription")}
      >
        <Button onClick={handleCreateNew} className="bg-polygon-blue">
          <Plus className="mr-2 h-4 w-4" /> {t("vacation.applyForVacation")}
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Tabs 
          defaultValue={isServicemedarbejder ? 'mine' : 'all'} 
          value={activeTab} 
          onValueChange={setActiveTab}
        >
          <VacationTabs 
            isServicemedarbejder={isServicemedarbejder} 
            activeTab={activeTab} 
          />

          <TabsContent value={activeTab} className="mt-6">
            <VacationList
              vacations={filteredVacations}
              canApproveVacation={canApproveVacation}
              onApprove={handleApproveClick}
              onReject={handleRejectClick}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Apply for vacation dialog */}
      <VacationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        onSubmit={handleSubmit}
      />

      {/* Approve/Reject note dialog */}
      <VacationActionDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        vacation={actionVacation}
        note={note}
        setNote={setNote}
        onAction={handleAction}
      />
    </>
  );
};

export default VacationPage;
