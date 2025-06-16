
import React from 'react';
import { DateRange } from 'react-day-picker';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import VacationFormDialog from './VacationFormDialog';
import VacationActionDialog from './VacationActionDialog';
import AdminVacationFormDialog from './AdminVacationFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface VacationDialogsProps {
  // Form state
  date: DateRange;
  setDate: (date: DateRange) => void;
  reason: string;
  setReason: (reason: string) => void;
  note: string;
  setNote: (note: string) => void;
  
  // New separate date fields
  startDate: Date | undefined;
  endDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  
  // New request type and time fields
  requestType: VacationRequestType;
  setRequestType: (type: VacationRequestType) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  
  // Dialog visibility
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  adminDialogOpen: boolean;
  setAdminDialogOpen: (open: boolean) => void;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  actionDialogOpen: boolean;
  setActionDialogOpen: (open: boolean) => void;
  
  // Data
  selectedVacation: Vacation | null;
  currentVacation: Vacation | null;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  actionType: "approve" | "reject";
  
  // Actions
  submitVacationRequest: (e: React.FormEvent) => void;
  submitAdminVacationRequest: (e: React.FormEvent) => void;
  submitEditVacation: (e: React.FormEvent) => void;
  handleActionSubmit: () => void;
  confirmDeleteVacation: () => void;
  handleDeleteCurrentVacation: () => void;
}

const VacationDialogs: React.FC<VacationDialogsProps> = ({
  date, setDate, reason, setReason, note, setNote,
  // New separate date fields
  startDate, endDate, setStartDate, setEndDate,
  // New request type and time fields
  requestType, setRequestType, startTime, setStartTime, endTime, setEndTime,
  dialogOpen, setDialogOpen,
  adminDialogOpen, setAdminDialogOpen,
  editDialogOpen, setEditDialogOpen,
  deleteDialogOpen, setDeleteDialogOpen,
  actionDialogOpen, setActionDialogOpen,
  selectedVacation, currentVacation, selectedEmployeeId, setSelectedEmployeeId,
  actionType,
  submitVacationRequest, submitAdminVacationRequest, submitEditVacation,
  handleActionSubmit, confirmDeleteVacation, handleDeleteCurrentVacation
}) => {
  const { t } = useTranslation();
  
  return (
    <>
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
        // New props
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        useSeparateDateFields={true}
        // Request type and time props
        requestType={requestType}
        setRequestType={setRequestType}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
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
        onSubmit={submitAdminVacationRequest}
        // New props
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        useSeparateDateFields={true}
        // Request type and time props
        requestType={requestType}
        setRequestType={setRequestType}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
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
        onDelete={handleDeleteCurrentVacation}
        // New props
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        useSeparateDateFields={true}
        // Request type and time props
        requestType={requestType}
        setRequestType={setRequestType}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
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
    </>
  );
};

export default VacationDialogs;
