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
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

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
    if (i.adminOnly && !isEffectiveAdmin) return false;
    if (i.featureFlag === 'duty' && !isDutyEnabled) return false;
    if (i.featureFlag === 'warehouse' && !isWarehouseEnabled) return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-14 flex items-center justify-center px-2">
        <Link to="/dashboard" className="flex items-center justify-center w-full">
          <div
            className={cn(
              'flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm',
              collapsed ? 'h-9 w-9' : 'h-9 w-9'
            )}
            aria-label="Polygon"
          >
            <span className="text-sm font-bold tracking-tight">P</span>
          </div>
          {!collapsed && (
            <span className="ml-2 font-semibold text-sm tracking-tight text-sidebar-foreground">
              Polygon
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        'h-10 relative font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <NavLink to={item.path} end>
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary-foreground/80"
                          />
                        )}
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.hasNotification && (
                          <span
                            className={cn(
                              'ml-auto inline-flex items-center justify-center rounded-full text-[10px] font-semibold tabular-nums px-1.5 h-4 min-w-[16px]',
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
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
