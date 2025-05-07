
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
  showApproved?: boolean;
}

const VacationPageContainer: React.FC<VacationPageContainerProps> = ({ 
  headerComponent, 
  showApproved = false 
}) => {
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

  // Modified filtering logic for vacations
  const filteredVacations = vacations.filter(v => {
    // If we're on the approved-only page, only show approved vacations
    if (showApproved) return v.status === 'approved';
    
    // For the main vacation page:
    if (activeTab === 'approved') return v.status === 'approved';
    if (activeTab === 'pending') return v.status === 'pending';
    if (activeTab === 'mine') return v.employeeId === user?.id;
    
    // For the "All" tab, show everything except rejected vacations
    return v.status !== 'rejected';
  });

  // Don't show the "approved" tab in the main vacations page if we have a dedicated page for it
  const hideApprovedTab = showApproved === false;

  return (
    <div className="space-y-6 w-full">
      {headerComponent}

      {!showApproved && (
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
      )}
      
      <Tabs 
        defaultValue={isServicemedarbejder ? 'mine' : 'all'} 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <VacationTabs 
          isServicemedarbejder={isServicemedarbejder} 
          activeTab={activeTab}
          hideApprovedTab={hideApprovedTab}
          showApprovedOnly={showApproved}
        />

        <TabsContent value={activeTab} className="mt-6">
          <VacationList
            vacations={filteredVacations}
            canApproveVacation={canApproveVacation && !showApproved}
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
