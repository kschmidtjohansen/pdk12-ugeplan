
// This file provides TypeScript type definitions for notifications

// Import the base Notification interface from the context
import { Notification } from '@/context/NotificationContext';

// Extend the Notification type with required fields for storage
export interface StoredNotification extends Notification {
  user_id: string;
}
