
import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationType } from '@/types/notification';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatNotificationDate, getNotificationIcon } from '@/utils/notifications';
import { Check, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationType;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { t, currentLanguage } = useTranslation();
  const { markAsRead, deleteNotification } = useNotifications();
  
  const formattedDate = formatNotificationDate(notification.date, currentLanguage);
  
  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };
  
  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };
  
  // Dynamically import the icon based on notification type
  const getIconComponent = () => {
    switch (notification.type) {
      case 'assignment':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'vacation':
        return <AlertCircle className="h-5 w-5 text-green-500" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    // If there's a link, wrap in Link, otherwise just return a div
    if (notification.link) {
      return (
        <Link
          to={notification.link}
          className="block"
          onClick={handleClick}
        >
          {children}
        </Link>
      );
    }
    return <div onClick={handleClick}>{children}</div>;
  };
  
  return (
    <li 
      className={cn(
        "p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer relative transition-colors",
        !notification.read && "bg-muted/30"
      )}
    >
      <ContentWrapper>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getIconComponent()}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={cn(
                "font-medium text-sm",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {notification.message}
            </p>
          </div>
        </div>
        
        <div className="absolute right-2 bottom-2 flex gap-1">
          {!notification.read && (
            <button
              onClick={handleMarkAsRead}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              title={t('notifications.markAsRead')}
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            title={t('notifications.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </ContentWrapper>
    </li>
  );
};

export default NotificationItem;
