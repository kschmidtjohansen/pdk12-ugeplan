
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavigationItem } from '@/types/navigation';

interface DesktopNavigationProps {
  items: NavigationItem[];
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ items }) => {
  const location = useLocation();

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopNavigation;
