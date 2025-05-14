
import React from 'react';
import { useVacations } from '@/hooks/useVacations';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import VacationTabContent from './VacationTabContent';
import VacationHeader from './VacationHeader';
import VacationDialogs from './VacationDialogs';

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
    confirmDeleteVacation,
    handleDeleteCurrentVacation
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
  
  // Handle approval action - only allow admin
  const handleApprove = (vacation: any) => {
    if (!isAdmin) return;
    
    setCurrentVacation(vacation);
    setActionType("approve");
    setActionDialogOpen(true);
  };
  
  // Handle rejection action - only allow admin
  const handleReject = (vacation: any) => {
    if (!isAdmin) return;
    
    setCurrentVacation(vacation);
    setActionType("reject");
    setActionDialogOpen(true);
  };
  
  // Submit approval/rejection
  const handleActionSubmit = () => {
    if (!currentVacation || !isAdmin) return;
    
    if (actionType === "approve") {
      approveVacation(currentVacation, note);
    } else {
      rejectVacation(currentVacation, note);
    }
    
    setActionDialogOpen(false);
    setNote("");
  };
  
  // Handle edit vacation - only allow admin
  const handleEdit = (vacation: any) => {
    if (!isAdmin) return;
    
    handleEditVacation(vacation);
  };
  
  // Handle delete vacation - only allow admin
  const handleDelete = (vacation: any) => {
    if (!isAdmin) return;
    
    handleDeleteVacation(vacation);
  };
  
  return (
    <div>
      {headerComponent}
      
      <VacationHeader 
        isServicemedarbejder={isServicemedarbejder}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenRequestDialog={handleOpenDialog}
        onOpenAdminDialog={handleOpenAdminDialog}
      />
      
      {/* Vacation tab content with all vacation cards */}
      <VacationTabContent
        vacations={vacations}
        tabValue={activeTab}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />
      
      <VacationDialogs
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        note={note}
        setNote={setNote}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        adminDialogOpen={adminDialogOpen}
        setAdminDialogOpen={setAdminDialogOpen}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        actionDialogOpen={actionDialogOpen}
        setActionDialogOpen={setActionDialogOpen}
        selectedVacation={selectedVacation}
        currentVacation={currentVacation}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        actionType={actionType}
        submitVacationRequest={submitVacationRequest}
        submitAdminVacationRequest={submitVacationRequest}
        submitEditVacation={submitEditVacation}
        handleActionSubmit={handleActionSubmit}
        confirmDeleteVacation={confirmDeleteVacation}
        handleDeleteCurrentVacation={handleDeleteCurrentVacation}
      />
    </div>
  );
};

export default VacationPageContainer;
