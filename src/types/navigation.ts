
import { ReactNode } from 'react';

export interface NavigationItem {
  path: string;
  name: string;
  icon: ReactNode;
  adminOnly?: boolean;
  translationKey: string;
}

export interface VacationEmployeeNotification {
  notificationId: string;
  employeeId: string;
  name: string;
  from: string;
  to: string;
}
