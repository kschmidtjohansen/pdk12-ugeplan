
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

export const useVacationFormState = () => {
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resetFormState = () => {
    setDate({ from: undefined, to: undefined });
    setReason('');
    setNote('');
    setSelectedEmployeeId('');
  };

  return {
    date,
    setDate,
    reason,
    setReason,
    note,
    setNote,
    selectedEmployeeId,
    setSelectedEmployeeId,
    adminDialogOpen,
    setAdminDialogOpen,
    dialogOpen,
    setDialogOpen,
    resetFormState
  };
};
