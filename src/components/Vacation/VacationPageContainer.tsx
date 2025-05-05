
import React, { useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import VacationTabs from './VacationTabs';
import VacationList from './VacationList';
import VacationFormDialog from './VacationFormDialog';
import VacationActionDialog from './VacationActionDialog';
import { useVacations } from '@/hooks/useVacations';

interface VacationPageContainerProps {
  headerComponent: React.ReactNode;
}

const VacationPageContainer: React.FC<VacationPageContainerProps> = ({ headerComponent }) => {
  const { isServicemedarbejder, canApproveVacation } = usePermissions();
  const { t } = useTranslation();
  const {
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
  } = useVacations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    const success = submitVacationRequest(e);
    if (success) {
      setDialogOpen(false);
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
    if (activeTab === 'mine') return v.employeeId === 'current-user-id'; // Replace with actual user ID
    return true;
  });

  return (
    <div className="space-y-6 w-full">
      {headerComponent}

      <Button onClick={handleCreateNew} className="bg-polygon-blue">
        <Plus className="mr-2 h-4 w-4" /> {t("vacation.applyForVacation")}
      </Button>
      
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
    </div>
  );
};

export default VacationPageContainer;
