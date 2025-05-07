
import React, { useState } from 'react';
import { Tabs } from "@/components/ui/tabs";
import { Vacation } from '../../types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import VacationTabs from './VacationTabs';
import VacationTabContent from './VacationTabContent';
import VacationButtons from './VacationButtons';
import VacationFormDialog from './VacationFormDialog';
import AdminVacationFormDialog from './AdminVacationFormDialog';
import VacationActionDialog from './VacationActionDialog';
import EmployeeVacationStatus from './EmployeeVacationStatus';
import { useVacations } from '@/hooks/useVacations';

interface VacationPageContainerProps {
  headerComponent: React.ReactNode;
}

const VacationPageContainer: React.FC<VacationPageContainerProps> = ({ headerComponent }) => {
  const { isServicemedarbejder, canApproveVacation } = usePermissions();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
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
  } = useVacations();
  
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [actionVacation, setActionVacation] = useState<Vacation | null>(null);
  const [activeTab, setActiveTab] = useState(isServicemedarbejder ? 'mine' : 'all');

  const handleCreateNew = () => {
    setDate({
      from: undefined,
      to: undefined
    });
    setReason('');
    setDialogOpen(true);
  };

  const handleCreateForEmployee = () => {
    setDate({
      from: undefined,
      to: undefined
    });
    setReason('');
    setSelectedEmployeeId('');
    setAdminDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    const success = submitVacationRequest(e);
    if (success) {
      setDialogOpen(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    const success = submitVacationRequest(e, true);
    if (success) {
      setAdminDialogOpen(false);
    }
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
    
    if (actionVacation.status === 'rejected') {
      rejectVacation(actionVacation, note);
    } else {
      approveVacation(actionVacation, note);
    }
    
    setNoteDialogOpen(false);
  };

  const filteredVacations = vacations.filter(v => {
    // In "mine" tab, show all user's vacation requests regardless of status
    if (activeTab === 'mine') return v.employeeId === user?.id;
    
    // In "approved" tab, only show approved vacations
    if (activeTab === 'approved') return v.status === 'approved';
    
    // In "pending" tab, only show pending vacations
    if (activeTab === 'pending') return v.status === 'pending';
    
    // In "all" tab:
    // 1. Never show rejected vacations (except in "mine" tab)
    // 2. Only show pending vacations (approved ones go to "approved" tab)
    return v.status === 'pending';
  });

  return (
    <div className="space-y-6 w-full">
      {headerComponent}

      <VacationButtons 
        onCreateNew={handleCreateNew}
        onCreateForEmployee={handleCreateForEmployee}
        canApproveVacation={canApproveVacation}
      />
      
      <Tabs 
        defaultValue={isServicemedarbejder ? 'mine' : 'all'} 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <VacationTabs 
          isServicemedarbejder={isServicemedarbejder} 
          activeTab={activeTab} 
        />

        <VacationTabContent 
          activeTab={activeTab}
          filteredVacations={filteredVacations}
          canApproveVacation={canApproveVacation}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
        />
      </Tabs>

      {/* Employee vacation status list */}
      <EmployeeVacationStatus vacations={vacations} />

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

      {/* Admin request for employee dialog */}
      <AdminVacationFormDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        onSubmit={handleAdminSubmit}
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
    </div>
  );
};

export default VacationPageContainer;
