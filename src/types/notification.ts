
export interface NotificationType {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  date: Date;
  targetUserId?: string;  // Added property for target user ID
}

export interface VacationNotification extends NotificationType {
  daysRemaining?: number;
  employeeName?: string;
  startDate?: Date;
  endDate?: Date;
}
