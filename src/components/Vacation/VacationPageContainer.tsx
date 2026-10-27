
import React from 'react';
import { useVacations } from '@/hooks/useVacations';
import { useAuth } from '@/context/AuthContext';
import { Vacation } from '@/types/vacation';
import { visibleVacations } from '@/utils/moduleListFilters';
import { ModuleContext } from '@/components/shared/ModuleListTools';
import { useDepartment } from '@/context/DepartmentContext';
import { useQueryClient } from '@tanstack/react-query';
import ErrorState from '@/components/shared/ErrorState';
import WorkspaceSection from '@/components/shared/WorkspaceSection';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import VacationTabContent from './VacationTabContent';
import VacationHeader from './VacationHeader';
import VacationDialogs from './VacationDialogs';

interface VacationPageContainerProps {
  headerComponent: React.ReactNode;
}

const VacationPageContainer: React.FC<VacationPageContainerProps> = ({ headerComponent }) => {
  const { user, isEffectiveAdmin, isEffectiveServicemedarbejder, effectiveRole, canViewAllVacations, canManageVacations } = useAuth();
  const viewAsServicemedarbejder = isEffectiveServicemedarbejder || effectiveRole === 'fugttekniker';
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const { selectedDepartment } = useDepartment();
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState("all");
  
  const {
    vacations,
    loading, error,
    date,
    setDate,
    // Add the missing state variables
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason,
    setReason,
    note,
    setNote,
    // New request type and time fields
    requestType,
    setRequestType,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
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
  
  const visible = React.useMemo(() => visibleVacations(vacations, user?.id, isEffectiveAdmin, isEffectiveServicemedarbejder, canViewAllVacations), [vacations, user?.id, isEffectiveAdmin, isEffectiveServicemedarbejder, canViewAllVacations]);
  const counts = React.useMemo(() => ({ all: visible.length, pending: visible.filter(v => v.status === 'pending').length, approved: visible.filter(v => v.status === 'approved').length, rejected: visible.filter(v => v.status === 'rejected').length }), [visible]);
  const resetFilters = () => { setActiveTab('all'); setSearch(''); };
  // State for approval/rejection dialog
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<"approve" | "reject">("approve");
  const [currentVacation, setCurrentVacation] = React.useState<Vacation | null>(null);
  
  // Open the dialog for regular employees to request vacation
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  
  // Open dialog for admins to request vacation on behalf of others
  const handleOpenAdminDialog = () => {
    setAdminDialogOpen(true);
  };
  
  // Handle approval action - allow admin and skadeleder
  const handleApprove = (vacation: Vacation) => {
    if (!canManageVacations) return;
    
    setCurrentVacation(vacation);
    setActionType("approve");
    setActionDialogOpen(true);
  };
  
  // Handle rejection action - allow admin and skadeleder
  const handleReject = (vacation: Vacation) => {
    if (!canManageVacations) return;
    
    setCurrentVacation(vacation);
    setActionType("reject");
    setActionDialogOpen(true);
  };
  
  // Submit approval/rejection
  const handleActionSubmit = () => {
    if (!currentVacation || !canManageVacations) return;
    
    if (actionType === "approve") {
      approveVacation(currentVacation, note);
    } else {
      rejectVacation(currentVacation, note);
    }
    
    setActionDialogOpen(false);
    setNote("");
  };
  
  // Handle edit vacation - allow admin and skadeleder
  const handleEdit = (vacation: Vacation) => {
    if (!canManageVacations) return;
    
    handleEditVacation(vacation);
  };
  
  // Handle delete vacation - allow admin and skadeleder
  const handleDelete = (vacation: Vacation) => {
    if (!canManageVacations) return;
    
    handleDeleteVacation(vacation);
  };
  
  // Wrapper for admin/skadeleder vacation request submission - Updated to close the dialog
  const submitAdminVacationRequest = (e: React.FormEvent) => {
    if (canManageVacations) {
      submitVacationRequest(e, true);
      // Close the admin dialog after submission
      setAdminDialogOpen(false);
    }
  };
  
  return (
    <div>
      {headerComponent}
      <ModuleContext department={selectedDepartment?.name} />
      
      <WorkspaceSection
        className="mt-2"
        flush
        title={da ? 'Ferie og fravær' : 'Time off and absence'}
        meta={<span data-testid="vacation-total-count">{da ? `${counts.all} anmodninger` : `${counts.all} requests`}{counts.pending > 0 && (da ? ` · ${counts.pending} afventer` : ` · ${counts.pending} pending`)}</span>}
        actions={activeTab !== 'calendar' && (
          <>
            <Button onClick={handleOpenDialog} size="sm" className="min-h-11 flex-1 whitespace-normal sm:flex-none">
              <Plus className="h-4 w-4" aria-hidden />
              {t('vacation.applyForVacation')}
            </Button>
            {canManageVacations && (
              <Button onClick={handleOpenAdminDialog} size="sm" variant="outline" className="min-h-11 flex-1 whitespace-normal sm:flex-none">
                <Plus className="h-4 w-4" aria-hidden />
                {t('vacation.requestForEmployee')}
              </Button>
            )}
          </>
        )}
      >
        <VacationHeader
          counts={counts}
          isServicemedarbejder={viewAsServicemedarbejder}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />
        {error ? (
          <div className="p-3 sm:p-4">
            <ErrorState description={error} onRetry={() => { void queryClient.invalidateQueries({ queryKey: ['vacations'] }); }} />
          </div>
        ) : (
          <VacationTabContent
            search={search} onSearch={setSearch} onReset={resetFilters}
            vacations={vacations}
            tabValue={activeTab}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={loading}
          />
        )}
      </WorkspaceSection>

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
        // New request type and time props
        requestType={requestType}
        setRequestType={setRequestType}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
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
        submitAdminVacationRequest={submitAdminVacationRequest}
        submitEditVacation={submitEditVacation}
        handleActionSubmit={handleActionSubmit}
        confirmDeleteVacation={confirmDeleteVacation}
        handleDeleteCurrentVacation={handleDeleteCurrentVacation}
      />
    </div>
  );
};

export default VacationPageContainer;
