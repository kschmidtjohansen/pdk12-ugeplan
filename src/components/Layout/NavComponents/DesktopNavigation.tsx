
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types/navigation';

interface DesktopNavigationProps {
  items: NavItem[];
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ items }) => {
  const location = useLocation();

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        const IconComponent = item.icon;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {IconComponent && <IconComponent className="h-4 w-4 flex-shrink-0" />}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopNavigation;
