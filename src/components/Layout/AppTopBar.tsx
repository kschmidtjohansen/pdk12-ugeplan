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
import VacationOverviewDropdown from './NavComponents/VacationOverviewDropdown';
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
  const { user, logout, isEffectiveAdmin, isSkadeleder } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const titleKey = ROUTE_TITLES[location.pathname];
  const title = titleKey ? t(titleKey) : '';

  // Vacation overview dropdown is visible to Skadeleder, Administrator and Super Admin
  const canSeeVacationOverview = isEffectiveAdmin || isSkadeleder;

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
    <header className="sticky top-0 z-40 h-11 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 border-b border-border/70">
      <div className="flex items-center h-full px-2 sm:px-3 gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground h-8 w-8" />
        <div className="h-4 w-px bg-border hidden sm:block" />
        <h1 className="text-[13px] font-semibold text-foreground tracking-tight truncate hidden sm:block">
          {title}
        </h1>
        <h1 className="text-[13px] font-semibold text-foreground tracking-tight truncate sm:hidden">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <NotificationsDropdown
            notifications={notifications.slice(0, 10)}
            unreadCount={unreadCount}
            markAllAsRead={markAllAsRead}
            handleNotificationClick={handleNotificationClick}
            clearNotification={deleteNotification}
          />
          {canSeeVacationOverview && <VacationOverviewDropdown />}
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
      <div aria-hidden className="brand-stripe h-px w-full" />
    </header>
  );
};

export default AppTopBar;
