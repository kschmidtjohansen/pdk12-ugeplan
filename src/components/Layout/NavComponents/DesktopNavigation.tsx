
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavigationItem } from '../../../types/navigation';
import { Badge } from '@/components/ui/badge';

interface DesktopNavigationProps {
  items: NavigationItem[];
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ items }) => {
  const location = useLocation();
  
  return (
    <div className="hidden md:ml-6 md:flex md:space-x-4">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium flex items-center relative",
            (location.pathname === item.path || 
             location.pathname === `/${item.translationKey.toLowerCase()}`) 
              ? "bg-polygon-blue text-white" 
              : "text-gray-700 hover:bg-polygon-lightgray"
          )}
        >
          <span className="mr-2">{item.icon}</span>
          <span>{item.name}</span>
          
          {/* Notification indicator */}
          {item.hasNotification && (
            <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
          )}
        </Link>
      ))}
    </div>
  );
};

export default DesktopNavigation;
