import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Car, Users, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

interface TabItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/cars', label: 'Biler', icon: Car },
  { to: '/employees', label: 'Medarbejdere', icon: Users },
];

const MobileBottomNav: React.FC = () => {
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  // Routes that "Mere" surfaces in the drawer
  const moreRoutes = ['/warehouse', '/duty', '/vacation', '/admin'];
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
      <ul className="flex items-stretch justify-around h-[56px]">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to!}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full w-full text-[10px] font-medium',
                  'transition-colors active:opacity-80',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{label}</span>
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 h-full w-full text-[10px] font-medium',
              'transition-colors active:opacity-80',
              moreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Mere"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="leading-none">Mere</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
