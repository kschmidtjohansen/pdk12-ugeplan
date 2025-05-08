
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
