
import React, { useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import VacationTabs from './VacationTabs';
import VacationList from './VacationList';
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
    if (activeTab === 'approved') return v.status === 'approved';
    if (activeTab === 'pending') return v.status === 'pending';
    if (activeTab === 'mine') return v.employeeId === user?.id; // Filter by current user's ID
    return true;
  });

  return (
    <div className="space-y-6 w-full">
      {headerComponent}

      <div className="flex space-x-2">
        <Button onClick={handleCreateNew} className="bg-polygon-blue">
          <Plus className="mr-2 h-4 w-4" /> {t("vacation.applyForVacation")}
        </Button>
        
        {/* Admin button for requesting vacation for others */}
        {canApproveVacation && (
          <Button onClick={handleCreateForEmployee} variant="outline" className="border-polygon-blue text-polygon-blue">
            <UserPlus className="mr-2 h-4 w-4" /> {t("vacation.requestForEmployee")}
          </Button>
        )}
      </div>
      
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
