
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavigationItem } from '../../../types/navigation';

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
            "px-3 py-2 rounded-md text-sm font-medium flex items-center",
            location.pathname === item.path 
              ? "bg-polygon-blue text-white" 
              : "text-gray-700 hover:bg-polygon-lightgray"
          )}
        >
          <span className="mr-2">{item.icon}</span>
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default DesktopNavigation;
