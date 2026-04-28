import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationType } from '@/types/notification';
import NotificationsDropdown from './NavComponents/NotificationsDropdown';
import ChangeLogDropdown from './NavComponents/ChangeLogDropdown';
import UserMenu from './NavComponents/UserMenu';
import { useToast } from '@/hooks/use-toast';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'navigation.dashboard',
  '/planner': 'navigation.planner',
  '/employees': 'navigation.employees',
  '/cars': 'navigation.cars',
  '/vacation': 'navigation.vacation',
  '/duty': 'navigation.duty',
  '/warehouse': 'navigation.warehouse',
  '/admin': 'navigation.admin',
};

const AppTopBar: React.FC = () => {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const titleKey = ROUTE_TITLES[location.pathname];
  const title = titleKey ? t(titleKey) : '';

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.logoutFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: NotificationType) => {
    markAsRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="flex items-center h-full px-3 sm:px-4 gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-5 w-px bg-border hidden sm:block" />
        <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-1.5">
          <NotificationsDropdown
            notifications={notifications.slice(0, 10)}
            unreadCount={unreadCount}
            markAllAsRead={markAllAsRead}
            handleNotificationClick={handleNotificationClick}
            clearNotification={deleteNotification}
          />
          <ChangeLogDropdown />
          <UserMenu
            user={user}
            currentLanguage={currentLanguage}
            setLanguage={setLanguage}
            handleLogout={handleLogout}
          />
        </div>
      </div>
      {/* brand stripe */}
      <div aria-hidden className="brand-stripe h-[2px] w-full" />
    </header>
  );
};

export default AppTopBar;
