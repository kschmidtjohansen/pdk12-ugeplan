
export type VacationStatus = 'pending' | 'approved' | 'rejected';

export interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: VacationStatus;
  createdAt: Date;
  notes?: string;
}

// Helper function to check if a string is a valid vacation status
export function isValidVacationStatus(status: string): status is VacationStatus {
  return ['pending', 'approved', 'rejected'].includes(status);
}
