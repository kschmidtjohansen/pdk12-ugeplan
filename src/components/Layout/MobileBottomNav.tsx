import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Phone, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/context/TranslationContext';
import { useUnreadMessagesContext } from '@/context/UnreadMessagesContext';

interface TabItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const MobileBottomNav: React.FC = () => {
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const { currentLanguage } = useTranslation();
  const { totalUnread } = useUnreadMessagesContext();
  const isDa = currentLanguage === 'da';

  const TABS: TabItem[] = [
    { to: '/dashboard', label: isDa ? 'Min Dag' : 'My Day', icon: Home },
    { to: '/planner', label: isDa ? 'Ugeplan' : 'Planner', icon: CalendarDays, badge: totalUnread },
    { to: '/duty', label: isDa ? 'Vagter' : 'Duties', icon: Phone },
  ];

  // Routes that "Mere" surfaces in the drawer
  const moreRoutes = ['/warehouse', '/cars', '/employees', '/vacation', '/admin'];
  const moreActive = moreRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <nav
      role="navigation"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background',
        'border-t border-border/70',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      style={{ borderTopWidth: '0.5px' }}
      aria-label="Mobil navigation"
    >
      <ul className="flex items-stretch justify-around min-h-[56px]">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-0.5 h-full w-full min-h-[44px] text-[10px] font-medium',
                  'transition-colors active:opacity-80',
                  isActive
                    ? 'text-primary after:absolute after:top-0 after:h-0.5 after:w-8 after:rounded-full after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.25]')} />
                  <span className="leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 h-full w-full min-h-[44px] text-[10px] font-medium',
              'transition-colors active:opacity-80',
              moreActive
                ? 'text-primary after:absolute after:top-0 after:h-0.5 after:w-8 after:rounded-full after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={isDa ? 'Mere' : 'More'}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="leading-none">{isDa ? 'Mere' : 'More'}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
