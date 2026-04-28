
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
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 overflow-visible">
          <Bell className="h-[15px] w-[15px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none z-[100]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        sideOffset={12}
        alignOffset={0}
        className="w-96 max-w-[calc(100vw-2rem)] z-[9999] bg-background border shadow-lg"
        avoidCollisions={true}
        collisionPadding={16}
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
