
import React from 'react';
import { useNotificationsContext } from '@/context/NotificationContext';
import { useTranslation } from '@/context/TranslationContext';
import NotificationItem from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotificationsList = () => {
  const { notifications, loading, unreadCount, markAllAsRead } = useNotificationsContext();
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
        <p>{t('notifications.noNotifications')}</p>
      </div>
    );
  }
  
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };
  
  return (
    <div className="flex flex-col">
      {unreadCount > 0 && (
        <div className="p-2 bg-muted/50 border-b flex items-center justify-between">
          <span className="text-sm font-medium">
            {t('notifications.unreadCount', { count: unreadCount })}
          </span>
          <Button
            variant="ghost" 
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-7 text-xs"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            {t('notifications.markAllAsRead')}
          </Button>
        </div>
      )}
      
      <ScrollArea className="max-h-[400px]">
        <ul>
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
};

export default NotificationsList;
