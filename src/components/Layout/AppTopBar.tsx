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
import PolyPlanMark from '@/components/branding/PolyPlanMark';
import DepartmentSwitcherPill from './NavComponents/DepartmentSwitcherPill';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/context/AuthContext';

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
  const { canCreate } = usePermissions();
  const commandKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

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
    <header role="banner" className="sticky top-0 z-40 facet-topbar facet-vt-topbar">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 sm:px-4">
        <div className="order-1 flex min-w-0 items-center gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground min-h-9 min-w-9 hidden md:inline-flex" />
          <Link to="/dashboard" className="shrink-0 md:hidden" aria-label={PRODUCT_NAME}>
            <PolyPlanMark size={28} decorative />
          </Link>
          <div className="min-w-0 md:hidden">
            <h1 className="font-display text-base font-semibold tracking-tight text-foreground break-words">{title}</h1>
          </div>
          {isPlanner && <span className="sm:block hidden border-l border-border pl-3 text-xs text-muted-foreground tabular-nums md:hidden">{t('planner.week')} {week}</span>}
          <div className="hidden min-w-0 md:block"><DepartmentSwitcherPill variant="inline" /></div>
        </div>
        <div className="order-2 flex shrink-0 items-center gap-1 workspace-tools md:order-3">
          {canSeeVacationOverview && <VacationOverviewDropdown />}
          <ChangeLogDropdown />
          <NotificationsDrawer />
          {canCreate && (
            <Button className="ml-1 hidden h-9 gap-1.5 rounded-full px-4 md:inline-flex" onClick={() => navigate('/planner?new=1')}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('planner.newAssignment')}
            </Button>
          )}
          <div className="md:hidden">
            <UserMenu
              user={user}
              currentLanguage={currentLanguage}
              setLanguage={setLanguage}
              handleLogout={handleLogout}
            />
          </div>
        </div>
        <div className="order-3 flex min-w-0 basis-full items-center justify-center border-t border-border/60 pt-1.5 md:order-2 md:basis-auto md:flex-1 md:border-t-0 md:pt-0">
          <div className="facet-command-pill flex w-full max-w-[440px] items-center pr-1">
            <GlobalAssignmentSearch />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              className="hidden h-7 shrink-0 items-center gap-1 rounded-full border border-border/80 bg-background/70 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors duration-140 ease-facet hover:bg-accent hover:text-foreground md:inline-flex"
              aria-label={currentLanguage === 'da' ? `Åbn kommandolinjen (${commandKey})` : `Open command line (${commandKey})`}
            >
              <kbd className="font-mono">{commandKey}</kbd>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppTopBar;
