import React from 'react';
import { useVacations } from '@/hooks/useVacations';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import VacationTabs from './VacationTabs';
import VacationTabContent from './VacationTabContent';
import VacationFormDialog from './VacationFormDialog';
import VacationActionDialog from './VacationActionDialog';
import AdminVacationFormDialog from './AdminVacationFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface VacationPageContainerProps {
  headerComponent: React.ReactNode;
}

const VacationPageContainer: React.FC<VacationPageContainerProps> = ({ headerComponent }) => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder, isServicemedarbejder } = usePermissions();
  const [activeTab, setActiveTab] = React.useState("all");
  
  const {
    vacations,
    loading,
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
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedVacation,
    selectedEmployeeId,
    setSelectedEmployeeId,
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    handleEditVacation,
    submitEditVacation,
    handleDeleteVacation,
    confirmDeleteVacation
  } = useVacations();
  
  // State for approval/rejection dialog
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<"approve" | "reject">("approve");
  const [currentVacation, setCurrentVacation] = React.useState<any>(null);
  
  // Open the dialog for regular employees to request vacation
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  
  // Open dialog for admins to request vacation on behalf of others
  const handleOpenAdminDialog = () => {
    setAdminDialogOpen(true);
  };
  
  // Handle approval action
  const handleApprove = (vacation: any) => {
    setCurrentVacation(vacation);
    setActionType("approve");
    setActionDialogOpen(true);
  };
  
  // Handle rejection action
  const handleReject = (vacation: any) => {
    setCurrentVacation(vacation);
    setActionType("reject");
    setActionDialogOpen(true);
  };
  
  // Submit approval/rejection
  const handleActionSubmit = () => {
    if (!currentVacation) return;
    
    if (actionType === "approve") {
      approveVacation(currentVacation, note);
    } else {
      rejectVacation(currentVacation, note);
    }
    
    setActionDialogOpen(false);
    setNote("");
  };
  
  return (
    <div>
      {headerComponent}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <VacationTabs
          isServicemedarbejder={isServicemedarbejder}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        <div className="flex gap-2">
          <Button 
            onClick={handleOpenDialog}
            className="bg-polygon-blue hover:bg-polygon-darkblue"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("vacation.applyForVacation")}
          </Button>
          
          {(isAdmin || isSkadeleder) && (
            <Button 
              onClick={handleOpenAdminDialog} 
              variant="outline"
              className="bg-white"
            >
              {t("vacation.requestForEmployee")}
            </Button>
          )}
        </div>
      </div>
      
      {/* Vacation tab content with all vacation cards */}
      <VacationTabContent
        vacations={vacations}
        tabValue={activeTab}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={handleEditVacation}
        onDelete={handleDeleteVacation}
        isLoading={loading}
      />
      
      {/* Regular vacation request dialog */}
      <VacationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        onSubmit={submitVacationRequest}
        isEditing={false}
      />
      
      {/* Admin vacation request dialog */}
      <AdminVacationFormDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        onSubmit={(e) => submitVacationRequest(e, true)}
      />
      
      {/* Vacation action dialog (approve/reject) */}
      <VacationActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        vacation={currentVacation}
        actionType={actionType}
        note={note}
        setNote={setNote}
        onSubmit={handleActionSubmit}
      />
      
      {/* Edit vacation dialog */}
      <VacationFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        onSubmit={submitEditVacation}
        isEditing={true}
        onDelete={handleDeleteVacation}
      />
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVacation}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VacationPageContainer;
