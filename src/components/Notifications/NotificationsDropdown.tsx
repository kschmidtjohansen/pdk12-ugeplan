
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
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none z-[100]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{t('notifications.notifications')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={12}
        alignOffset={-8}
        className="w-96 max-h-[80vh] overflow-y-auto z-[100] bg-background dark:bg-slate-900 border shadow-lg"
        avoidCollisions={true}
        collisionPadding={24}
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
