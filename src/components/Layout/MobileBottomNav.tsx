import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/context/TranslationContext';
import { useUnreadMessagesContext } from '@/context/UnreadMessagesContext';
import { useDepartment } from '@/context/DepartmentContext';
import { buildMobileTabs } from '@/components/Layout/mobileNavTabs';

const MobileBottomNav: React.FC = () => {
  const { setOpenMobile, openMobile } = useSidebar();
  const location = useLocation();
  const { currentLanguage } = useTranslation();
  const { totalUnread } = useUnreadMessagesContext();
  const { isDutyEnabled } = useDepartment();
  const isDa = currentLanguage === 'da';

  // Same feature flags as the desktop sidebar: /duty is hidden when the
  // department has the duty module disabled.
  const TABS = buildMobileTabs({ isDa, isDutyEnabled, totalUnread });

  // Routes that "Mere" surfaces in the drawer
  const moreRoutes = ['/warehouse', '/cars', '/employees', '/vacation', '/admin'];
  const moreActive = moreRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <nav
      role="navigation"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card',
        'border-t border-border/70',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Mobil navigation"
    >
      <ul className="flex items-stretch justify-around min-h-[64px] px-2 gap-1">
        {TABS.map(({ to, label, icon: Icon, badge }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 h-full w-full min-h-[64px] text-[11px] font-medium',
                  'transition-colors active:opacity-80',
                  isActive
                    ? 'text-foreground bg-accent after:absolute after:top-0 after:h-0.5 after:inset-x-3 after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2.25]')} />
                    {!!badge && badge > 0 && (
                      <span
                        aria-label={isDa ? `${badge} nye beskeder` : `${badge} new messages`}
                        className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums text-destructive-foreground"
                      >
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  <span className="leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <Button
            variant="ghost"
            type="button"
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(true)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 h-full w-full min-h-[64px] text-[11px] font-medium',
              'transition-colors active:opacity-80',
              moreActive
                ? 'text-foreground bg-accent after:absolute after:top-0 after:h-0.5 after:inset-x-3 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={isDa ? 'Mere' : 'More'}
          >
            <MoreHorizontal className="h-[22px] w-[22px]" />
            <span className="leading-none">{isDa ? 'Mere' : 'More'}</span>
          </Button>
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
