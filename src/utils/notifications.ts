import { NotificationType } from '@/types/notification';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';

/**
 * Format notification date based on language
 * @param date The date to format
 * @param language Current language ('en' or 'da')
 */
export const formatNotificationDate = (date: Date, language: string = 'en'): string => {
  const locale = language === 'da' ? da : enUS;
  const today = new Date();
  const notificationDate = new Date(date);
  
  // If it's today, show time only
  if (
    notificationDate.getDate() === today.getDate() &&
    notificationDate.getMonth() === today.getMonth() &&
    notificationDate.getFullYear() === today.getFullYear()
  ) {
    return format(notificationDate, 'HH:mm', { locale });
  }
  
  // If it's this year, show day and month
  if (notificationDate.getFullYear() === today.getFullYear()) {
    return format(notificationDate, language === 'da' ? 'd. MMM' : 'MMM d', { locale });
  }
  
  // Otherwise, show day, month and year
  return format(notificationDate, language === 'da' ? 'd. MMM yyyy' : 'MMM d, yyyy', { locale });
};

/**
 * Get appropriate icon class based on notification type
 */
export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'assignment':
      return 'calendar';
    case 'vacation':
      return 'palm-tree';
    case 'system':
      return 'bell';
    case 'alert':
      return 'alert-triangle';
    default:
      return 'info';
  }
};

/**
 * Sort notifications with unread first, then by date
 */
export const sortNotifications = (a: NotificationType, b: NotificationType): number => {
  // First sort by read status (unread first)
  if (a.read !== b.read) {
    return a.read ? 1 : -1;
  }
  
  // Then sort by date (newest first)
  return b.date.getTime() - a.date.getTime();
};
