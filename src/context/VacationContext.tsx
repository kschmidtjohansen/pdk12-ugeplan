
import React, { createContext, useContext, ReactNode } from 'react';
import { useVacationCore } from '@/hooks/vacation/useVacationCore';
import { Vacation } from '@/types/vacation';
import { DateRange } from 'react-day-picker';

// Define the shape of our context
interface VacationContextType {
  // Data
  vacations: Vacation[];
  loading: boolean;
  error: string | null;
  
  // Form state
  date: DateRange;
  setDate: (date: DateRange) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  reason: string;
  setReason: (reason: string) => void;
  note: string;
  setNote: (note: string) => void;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  
  // Dialog state
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  adminDialogOpen: boolean;
  setAdminDialogOpen: (open: boolean) => void;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  
  // Vacation state
  selectedVacation: Vacation | null;
  setSelectedVacation: (vacation: Vacation | null) => void;
  
  // Actions
  submitVacationRequest: (e: React.FormEvent) => Promise<boolean>;
  approveVacation: (vacation: Vacation, note?: string) => void;
  rejectVacation: (vacation: Vacation, reason: string) => void;
  prepareVacationForEdit: (vacation: Vacation) => void;
  submitEditVacation: (e: React.FormEvent) => Promise<void>;
  handleDeleteVacation: (vacation: Vacation) => void;
  confirmDeleteVacation: () => Promise<boolean>;
  handleDeleteCurrentVacation: () => void;
  
  // Utilities
  resetFormState: () => void;
  fetchVacations: () => Promise<void>;
}

// Create the context
const VacationContext = createContext<VacationContextType | undefined>(undefined);

// Provider component
export const VacationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const vacationData = useVacationCore();
  
  return (
    <VacationContext.Provider value={vacationData as unknown as VacationContextType}>
      {children}
    </VacationContext.Provider>
  );
};

// Hook to use the vacation context
export const useVacationContext = () => {
  const context = useContext(VacationContext);
  
  if (context === undefined) {
    throw new Error('useVacationContext must be used within a VacationProvider');
  }
  
  return context;
};
