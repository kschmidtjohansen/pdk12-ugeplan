import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationType } from '@/types/notification';
import NotificationsDrawer from './NavComponents/NotificationsDrawer';
import ChangeLogDropdown from './NavComponents/ChangeLogDropdown';
import UserMenu from './NavComponents/UserMenu';
import VacationOverviewDropdown from './NavComponents/VacationOverviewDropdown';
import GlobalAssignmentSearch from './NavComponents/GlobalAssignmentSearch';
import { useToast } from '@/hooks/use-toast';
import { usePlannerWeek } from '@/stores/plannerWeekStore';
import { PRODUCT_NAME } from '@/config/product';
import polygonMark from '@/assets/polygon-mark.png';

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
  const { user, logout, isEffectiveAdmin, isSkadeleder, canViewAllVacations } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const titleKey = ROUTE_TITLES[location.pathname];
  const title = titleKey ? t(titleKey) : '';
  const { week } = usePlannerWeek();
  const isPlanner = location.pathname === '/planner';

  // Vacation overview dropdown is visible to Skadeleder, Administrator and Super Admin
  const canSeeVacationOverview = canViewAllVacations;

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
    <header role="banner" className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 sm:px-4">
        <div className="order-1 flex min-w-0 items-center gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground min-h-9 min-w-9 hidden md:inline-flex" />
          <Link to="/dashboard" className="shrink-0 md:hidden" aria-label={PRODUCT_NAME}>
            <img src={polygonMark} alt="" aria-hidden className="h-7 w-7 object-contain" draggable={false} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground break-words">{title}</h1>
          </div>
          {isPlanner && <span className="hidden sm:block border-l border-border pl-3 text-xs text-muted-foreground tabular-nums">{t('planner.week')} {week}</span>}
        </div>
        <div className="order-2 flex shrink-0 items-center gap-1 workspace-tools md:order-3">
          {canSeeVacationOverview && <VacationOverviewDropdown />}
          <ChangeLogDropdown />
          <NotificationsDrawer />
          <UserMenu
            user={user}
            currentLanguage={currentLanguage}
            setLanguage={setLanguage}
            handleLogout={handleLogout}
          />
        </div>
        <div className="order-3 flex min-w-0 basis-full items-center border-t border-border pt-1.5 md:order-2 md:basis-auto md:flex-1 md:border-t-0 md:pt-0">
          <GlobalAssignmentSearch />
        </div>
      </div>
    </header>
  );
};

export default AppTopBar;
