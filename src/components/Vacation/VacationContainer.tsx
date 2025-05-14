
import React, { useState } from 'react';
import { useVacations } from '@/hooks/useVacations';
import { usePermissions } from '@/context/AuthContext';
import VacationHeader from './VacationHeader';
import VacationDialogs from './VacationDialogs';
import VacationTabContent from './VacationTabContent';

interface VacationContainerProps {
  headerComponent: React.ReactNode;
}

const VacationContainer: React.FC<VacationContainerProps> = ({ headerComponent }) => {
  const { isServicemedarbejder } = usePermissions();
  const [activeTab, setActiveTab] = useState("all");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [currentVacation, setCurrentVacation] = useState<any>(null);
  
  const {
    vacations,
    loading,
    date,
    setDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
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
    prepareVacationForEdit,
    submitEditVacation,
    handleDeleteVacation,
    confirmDeleteVacation,
    handleDeleteCurrentVacation
  } = useVacations();

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
      
      <VacationHeader 
        isServicemedarbejder={isServicemedarbejder}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenRequestDialog={handleOpenDialog}
        onOpenAdminDialog={handleOpenAdminDialog}
      />
      
      <VacationTabContent
        vacations={vacations}
        tabValue={activeTab}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={prepareVacationForEdit}
        onDelete={handleDeleteVacation}
        isLoading={loading}
      />
      
      <VacationDialogs
        date={date}
        setDate={setDate}
        reason={reason}
        setReason={setReason}
        note={note}
        setNote={setNote}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
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

export default VacationContainer;
