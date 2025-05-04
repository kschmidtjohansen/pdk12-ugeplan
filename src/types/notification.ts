
export interface NotificationType {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  date: Date;
}
