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
import polygonMark from '@/assets/polygon-mark.png';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useVacationRequestsStatus } from '@/hooks/vacation/useVacationRequestsStatus';
import { cn } from '@/lib/utils';

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
  const { isEffectiveAdmin } = useAuth();
  const { isDutyEnabled, isWarehouseEnabled } = useDepartment();
  const { hasPendingRequests, pendingCount } = useVacationRequestsStatus();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const closeMobile = () => { if (isMobile) setOpenMobile(false); };

  const allItems: NavItem[] = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { path: '/planner', label: t('navigation.planner'), icon: Clock },
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
    if (i.featureFlag === 'duty' && !isDutyEnabled) return false;
    if (i.featureFlag === 'warehouse' && !isWarehouseEnabled) return false;
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
            'h-10 font-medium cursor-pointer transition-[background-color,color,opacity] duration-150 ease-out',
            isActive
              ? 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
              : 'text-sidebar-foreground/80 hover:bg-accent/40'
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
      <SidebarHeader className="border-b border-sidebar-border h-12 flex items-center justify-center px-2">
        <Link
          to="/dashboard"
          onClick={closeMobile}
          className="flex items-center justify-center w-full h-full overflow-hidden"
          aria-label="Polygon"
        >
          {collapsed ? (
            <img
              src={polygonMark}
              alt="Polygon"
              className="h-8 w-8 select-none object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex items-center justify-center gap-2.5 mx-auto">
              <img
                src={polygonMark}
                alt=""
                aria-hidden
                className="h-7 w-7 select-none object-contain shrink-0"
                draggable={false}
              />
              <img
                src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
                alt="Polygon"
                className="h-5 w-auto select-none"
                width="110"
                height="20"
                loading="eager"
                fetchPriority="high"
                draggable={false}
              />
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
        {showAdmin && (
          <SidebarMenu>{renderItem(adminItem!)}</SidebarMenu>
        )}
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/50 text-center px-2 leading-tight">
            Polygon Ugeplan
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
