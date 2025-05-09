
import { Notification } from '@/context/NotificationContext';

// Extend the Notification type with required fields for storage
export interface StoredNotification extends Notification {
  user_id: string;
}
