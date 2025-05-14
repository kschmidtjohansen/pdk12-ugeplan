
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{t('notifications.notifications')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h3 className="font-medium">{t('notifications.notifications')}</h3>
        </div>
        <NotificationsList />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
