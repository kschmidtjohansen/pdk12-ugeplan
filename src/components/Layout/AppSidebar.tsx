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
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Clock, Users, Car, Calendar, Shield, Package, Settings } from 'lucide-react';
import PolyPlanBrand from '@/components/branding/PolyPlanBrand';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useVacationRequestsStatus } from '@/hooks/vacation/useVacationRequestsStatus';
import { useUnreadMessagesContext } from '@/context/UnreadMessagesContext';
import { cn } from '@/lib/utils';
import { PRODUCT_NAME } from '@/config/product';
import DepartmentSwitcherPill from './NavComponents/DepartmentSwitcherPill';

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
  const { t } = useTranslation();
  const { isEffectiveAdmin, canViewDuty, canViewWarehouse } = useAuth();
  const { isDutyEnabled, isWarehouseEnabled } = useDepartment();
  const { hasPendingRequests, pendingCount } = useVacationRequestsStatus();
  const { totalUnread } = useUnreadMessagesContext();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed' && !isMobile;

  const closeMobile = () => { if (isMobile) setOpenMobile(false); };

  const allItems: NavItem[] = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    {
      path: '/planner',
      label: t('navigation.planner'),
      icon: Clock,
      hasNotification: totalUnread > 0,
      notificationCount: totalUnread,
    },
    { path: '/employees', label: t('navigation.employees'), icon: Users },
    { path: '/cars', label: t('navigation.cars'), icon: Car },
    {
      path: '/vacation',
      label: t('navigation.vacation'),
      icon: Calendar,
      hasNotification: hasPendingRequests,
      notificationCount: pendingCount,
    },
    { path: '/duty', label: t('navigation.duty'), icon: Shield, featureFlag: 'duty' },
    { path: '/warehouse', label: t('navigation.warehouse'), icon: Package, featureFlag: 'warehouse' },
    { path: '/admin', label: t('navigation.admin'), icon: Settings, adminOnly: true },
  ];

  const items = allItems.filter((i) => {
    if (i.adminOnly) return false; // Admin rendered separately in footer
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
            'h-11 text-sm font-medium cursor-pointer rounded-md transition-[background-color,color,opacity] duration-150 ease-out',
            isActive
              ? 'list-row-selected text-sidebar-accent-foreground hover:text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
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
                    ? 'bg-primary/15 text-primary'
                    : 'bg-destructive text-destructive-foreground'
                )}
              >
                {item.notificationCount && item.notificationCount > 0
                  ? item.notificationCount
                  : '!'}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border min-h-20 flex items-center justify-center px-3">
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
        <div className="px-4 py-4 border-b border-sidebar-border">
          <p className="text-xs text-muted-foreground mb-1">{t('common.department')}</p>
          <div className="mt-2"><DepartmentSwitcherPill /></div>
        </div>
      )}
      <SidebarContent className="py-3" role="navigation" aria-label={t('ui.primaryNavigation')}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter role="contentinfo" className="border-t border-sidebar-border p-2 space-y-1">
        {showAdmin && adminItem && (
          <SidebarMenu>{renderItem(adminItem)}</SidebarMenu>
        )}
        {!collapsed && (
          <div className="flex flex-col items-center gap-1 px-2 pt-1">
            <p className="text-[10px] text-muted-foreground text-center leading-tight">
              {PRODUCT_NAME}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
