
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { VacationRequestType } from '@/types/vacation';

export const useVacationFormState = () => {
  // Combined date range for the legacy date selection
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  
  // Individual dates for the new date selection
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // New fields for request type and times
  const [requestType, setRequestType] = useState<VacationRequestType>('full_day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Update both date representations when either is changed
  const handleStartDateChange = (newStartDate: Date | undefined) => {
    setStartDate(newStartDate);
    
    // Also update the combined date range
    setDate(prev => ({
      from: newStartDate,
      to: prev.to
    }));
  };

  const handleEndDateChange = (newEndDate: Date | undefined) => {
    setEndDate(newEndDate);
    
    // Also update the combined date range
    setDate(prev => ({
      from: prev.from,
      to: newEndDate
    }));
  };

  // Update individual dates when date range changes
  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDate(newDateRange);
    
    // Also update individual dates
    if (newDateRange.from) {
      setStartDate(newDateRange.from);
    }
    
    if (newDateRange.to) {
      setEndDate(newDateRange.to);
    }
  };

  const resetFormState = () => {
    setDate({ from: undefined, to: undefined });
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    setNote('');
    setSelectedEmployeeId('');
    setRequestType('full_day');
    setStartTime('');
    setEndTime('');
  };

  return {
    // Legacy date range
    date,
    setDate: handleDateRangeChange,
    
    // New individual dates
    startDate,
    setStartDate: handleStartDateChange,
    endDate,
    setEndDate: handleEndDateChange,
    
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
    
    // New request type and time fields
    requestType,
    setRequestType,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    
    resetFormState
  };
};
