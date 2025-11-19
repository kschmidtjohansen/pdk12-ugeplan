
import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslation } from '@/context/TranslationContext';
import NotificationsList from './NotificationsList';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

const NotificationsDropdown: React.FC = () => {
  const { notifications, unreadCount } = useNotifications();
  const { t } = useTranslation();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 overflow-visible">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="
                absolute -top-2 -right-2
                bg-red-500 text-white
                text-[13px] font-bold
                min-w-[22px] h-[22px]
                rounded-full
                flex items-center justify-center
                leading-none
                shadow-xl
                z-[100]
                border-2 border-white
                pointer-events-none
              "
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{t('notifications.notifications')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        className="w-80 z-[100] bg-white border shadow-lg"
        avoidCollisions={true}
        collisionPadding={20}
      >
        <div className="p-3 border-b">
          <h3 className="font-medium">{t('notifications.notifications')}</h3>
        </div>
        <NotificationsList />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
