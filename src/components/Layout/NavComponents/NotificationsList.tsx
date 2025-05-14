
import React from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types/notification';
import { useTranslation } from '@/context/TranslationContext';

interface NotificationsListProps {
  notifications: NotificationType[];
  onNotificationClick: (notification: NotificationType) => void;
  onClearNotification: (id: string) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  onNotificationClick,
  onClearNotification
}) => {
  const { t } = useTranslation();

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('notifications.noNotifications')}
      </div>
    );
  }
  
  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={cn(
            "flex flex-col items-start p-3 cursor-pointer gap-1 border-b last:border-0",
            !notification.read && "bg-muted"
          )}
          onClick={() => onNotificationClick(notification)}
        >
          <div className="flex justify-between w-full">
            <span className="font-medium">{notification.title}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5" 
              onClick={(e) => {
                e.stopPropagation();
                onClearNotification(notification.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-sm">{notification.message}</span>
          <span className="text-xs text-muted-foreground">
            {format(notification.date, 'PPpp')}
          </span>
        </div>
      ))}
      
      <div className="px-2 py-1.5 text-center">
        <Link 
          to="/vacation" 
          className="text-sm text-polygon-purple hover:underline"
        >
          {t('notifications.viewAll')}
        </Link>
      </div>
    </div>
  );
};

export default NotificationsList;
