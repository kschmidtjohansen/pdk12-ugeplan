
import { useState } from "react";
import { DateRange } from "react-day-picker";

export const useVacationForm = () => {
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const resetForm = () => {
    setDate({
      from: undefined,
      to: undefined
    });
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
    dialogOpen,
    setDialogOpen,
    adminDialogOpen,
    setAdminDialogOpen,
    resetForm
  };
};
