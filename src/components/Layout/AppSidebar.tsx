import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Home, CalendarDays, Users, Car, Sun, Shield, Package, SlidersHorizontal, ScanLine, ChevronDown } from 'lucide-react';
import UserMenu from './NavComponents/UserMenu';
import { useToast } from '@/hooks/use-toast';
import PolyPlanBrand from '@/components/branding/PolyPlanBrand';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useVacationRequestsStatus } from '@/hooks/vacation/useVacationRequestsStatus';
import { useUnreadMessagesContext } from '@/context/UnreadMessagesContext';
import { cn } from '@/lib/utils';
import { PRODUCT_NAME } from '@/config/product';
import DepartmentSwitcherPill from './NavComponents/DepartmentSwitcherPill';
import { useScanAccess, SCANS_ROUTE } from '@/hooks/useScanAccess';
import { scanSectionFromSearch } from '@/lib/scansNavigation';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  featureFlag?: 'duty' | 'warehouse';
  hasNotification?: boolean;
  notificationCount?: number;
}

const AppSidebar: React.FC = () => {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { user, logout, isEffectiveAdmin, canViewDuty, canViewWarehouse } = useAuth();
  const { toast } = useToast();
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      toast({ title: t('common.error'), description: t('auth.logoutFailed'), variant: 'destructive' });
    }
  };
  const { isDutyEnabled, isWarehouseEnabled } = useDepartment();
  const { hasPendingRequests, pendingCount } = useVacationRequestsStatus();
  const { totalUnread } = useUnreadMessagesContext();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed' && !isMobile;
  const canSeeScans = useScanAccess();
  const onScans = location.pathname === SCANS_ROUTE;
  const [scansOpen, setScansOpen] = React.useState(onScans);
  React.useEffect(() => { if (onScans) setScansOpen(true); }, [onScans]);
  const scanSection = scanSectionFromSearch(location.search);

  const closeMobile = () => { if (isMobile) setOpenMobile(false); };

  const allItems: NavItem[] = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: Home },
    {
      path: '/planner',
      label: t('navigation.planner'),
      icon: CalendarDays,
      hasNotification: totalUnread > 0,
      notificationCount: totalUnread,
    },
    { path: '/employees', label: t('navigation.employees'), icon: Users },
    { path: '/cars', label: t('navigation.cars'), icon: Car },
    {
      path: '/vacation',
      label: t('navigation.vacation'),
      icon: Sun,
      hasNotification: hasPendingRequests,
      notificationCount: pendingCount,
    },
    { path: '/duty', label: t('navigation.duty'), icon: Shield, featureFlag: 'duty' },
    { path: '/warehouse', label: t('navigation.warehouse'), icon: Package, featureFlag: 'warehouse' },
    { path: '/admin', label: t('navigation.admin'), icon: SlidersHorizontal, adminOnly: true },
  ];

  const items = allItems.filter((i) => {
    if (i.adminOnly) return false; // Admin comes last, after 3D-scanninger
    if (i.featureFlag === 'duty' && (!isDutyEnabled || !canViewDuty)) return false;
    if (i.featureFlag === 'warehouse' && (!isWarehouseEnabled || !canViewWarehouse)) return false;
    return true;
  });

  const adminItem = allItems.find((i) => i.path === '/admin');
  const showAdmin = !!adminItem && isEffectiveAdmin;

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.label}
          className={cn(
            'h-10 text-sm font-medium cursor-pointer rounded-control transition-[background-color,color,box-shadow] duration-140 ease-facet',
            isActive
              ? 'facet-nav-active'
              : 'text-sidebar-foreground hover:bg-sidebar-accent [&>svg]:text-muted-foreground'
          )}
        >
          <NavLink to={item.path} end onClick={closeMobile}>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.hasNotification && (
              <span
                className={cn(
                  'ml-auto inline-flex items-center justify-center rounded-full text-[10px] font-semibold tabular-nums px-1.5 h-4 min-w-[16px]',
                  isActive
                    ? 'bg-primary/20 text-primary-strong'
                    : 'bg-destructive text-destructive-foreground'
                )}
              >
                {item.notificationCount && item.notificationCount > 0
                  ? item.notificationCount
                  : '!'}
              </span>
            )}
            {isActive && !item.hasNotification && <span aria-hidden className="facet-nav-dot ml-auto" />}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="facet-sidebar facet-vt-sidebar border-r-0">
      <SidebarHeader className="min-h-16 flex items-center justify-center px-3 pt-3">
        <Link
          to="/dashboard"
          onClick={closeMobile}
          className="flex items-center justify-center w-full h-full overflow-hidden"
          aria-label={PRODUCT_NAME}
        >
          {collapsed ? (
            <PolyPlanBrand size={32} markOnly />
          ) : (
            <PolyPlanBrand size={28} className="mr-auto" wordmarkClassName="text-[15px] text-sidebar-foreground" />
          )}
        </Link>
      </SidebarHeader>

      {!collapsed && (
        <div className="px-3 pb-1 pt-1">
          <DepartmentSwitcherPill variant="box" />
        </div>
      )}
      <SidebarContent className="py-3" role="navigation" aria-label={t('ui.primaryNavigation')}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(renderItem)}
              {canSeeScans && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={onScans} tooltip="3D-scanninger" className={cn('h-10 text-sm font-medium rounded-control transition-[background-color,color,box-shadow] duration-140 ease-facet', onScans ? 'facet-nav-active' : 'text-sidebar-foreground hover:bg-sidebar-accent [&>svg]:text-muted-foreground')}>
                    <Link to={SCANS_ROUTE} onClick={() => { setScansOpen(true); closeMobile(); }}>
                      <ScanLine className="h-[18px] w-[18px] shrink-0" /><span>3D-scanninger</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction onClick={() => setScansOpen(open => !open)} aria-label={scansOpen ? 'Fold 3D-scanninger sammen' : 'Fold 3D-scanninger ud'} aria-expanded={scansOpen} aria-controls="scans-submenu" className="top-2 h-7 w-7">
                    <ChevronDown className={cn('transition-transform motion-reduce:transition-none', !scansOpen && '-rotate-90')} />
                  </SidebarMenuAction>
                  {scansOpen && !collapsed && <SidebarMenuSub id="scans-submenu">
                    {([
                      ['tours', 'Rundvisninger'], ['shares', 'Delt med forsikringer'], ['archive', 'Arkiv'],
                    ]).map(([section, label]) => (
                      <SidebarMenuSubItem key={section}>
                        <SidebarMenuSubButton asChild isActive={onScans && scanSection === section} className="min-h-11 h-auto py-2">
                          <Link to={`${SCANS_ROUTE}?view=${section}`} onClick={closeMobile}><span className="whitespace-normal">{label}</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>}
                </SidebarMenuItem>
              )}
              {showAdmin && adminItem && renderItem(adminItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter role="contentinfo" className="border-t border-sidebar-border/70 p-2">
        <UserMenu
          user={user}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
          handleLogout={handleLogout}
          variant="card"
          collapsed={collapsed}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
