
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationType } from '@/types/notification';
import NotificationActions from './NotificationActions';
import NotificationsList from './NotificationsList';

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
    unreadCount,
    notificationTypes: notifications.slice(0, 5).map(n => n.type),
    hasUnreadVacation: notifications.some(n => !n.read && n.type === 'vacation')
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
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        className="w-80 z-[9999] bg-background border shadow-lg"
        avoidCollisions={true}
        collisionPadding={20}
        style={{ position: 'fixed' }}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications.title')}</span>
          <NotificationActions 
            hasUnread={unreadCount > 0}
            onMarkAllAsRead={markAllAsRead}
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <NotificationsList 
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onClearNotification={clearNotification}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
