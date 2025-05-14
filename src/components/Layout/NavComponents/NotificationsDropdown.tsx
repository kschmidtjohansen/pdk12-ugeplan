
import React from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationType } from '../../../types/notification';

interface NotificationsDropdownProps {
  notifications: NotificationType[];
  unreadCount: number;
  markAllAsRead: () => void;
  handleNotificationClick: (notification: NotificationType) => void;
  clearNotification: (id: string) => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  markAllAsRead,
  handleNotificationClick,
  clearNotification,
}) => {
  const { t } = useTranslation();
  
  // Add debug logs
  console.log('NotificationsDropdown rendering with:', { 
    notificationCount: notifications.length, 
    unreadCount 
  });
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-polygon-purple text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications.title')}</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              <Check className="mr-1 h-3 w-3" />
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('notifications.noNotifications')}
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer gap-1",
                  !notification.read && "bg-muted"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between w-full">
                  <span className="font-medium">{notification.title}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm">{notification.message}</span>
                <span className="text-xs text-muted-foreground">
                  {format(notification.date, 'PPpp')}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="px-2 py-1.5 text-center">
            <Link 
              to="/vacation" 
              className="text-sm text-polygon-purple hover:underline"
            >
              {t('notifications.viewAll')}
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
