
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavigationItem } from '../../../types/navigation';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface DesktopNavigationProps {
  items: NavigationItem[];
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ items }) => {
  const location = useLocation();
  
  const isActiveParent = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      return item.children.some(child => location.pathname === child.path);
    }
    return location.pathname === item.path;
  };

  return (
    <div className="hidden md:flex md:space-x-4">
      {items.map((item) => {
        // If item has children, render as dropdown
        if (item.children && item.children.length > 0) {
          return (
            <DropdownMenu key={item.path}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center relative overflow-visible",
                    isActiveParent(item)
                      ? "bg-polygon-blue text-white" 
                      : "text-gray-700 hover:bg-polygon-lightgray"
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.name}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                  
                  {/* Notification indicator */}
                  {item.hasNotification && (
                    <Badge className="absolute top-0 right-0 translate-x-1 -translate-y-1 h-3 w-3 p-0 bg-red-500 border-2 border-white z-[1] pointer-events-none" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border shadow-lg z-50">
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.path} asChild>
                    <Link
                      to={child.path}
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-sm",
                        location.pathname === child.path
                          ? "bg-polygon-blue text-white" 
                          : "text-gray-700 hover:bg-polygon-lightgray"
                      )}
                    >
                      <span className="mr-2">{child.icon}</span>
                      <span>{child.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        // Regular navigation item
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium flex items-center relative overflow-visible",
              location.pathname === item.path 
                ? "bg-polygon-blue text-white" 
                : "text-gray-700 hover:bg-polygon-lightgray"
            )}
          >
            <span className="mr-2">{item.icon}</span>
            <span>{item.name}</span>
            
            {/* Notification indicator */}
            {item.hasNotification && (
              <>
                <Badge className="absolute top-0 right-0 translate-x-1 -translate-y-1 h-3 w-3 p-0 bg-red-500 border-2 border-white z-[1] pointer-events-none" />
                {console.log('[DesktopNavigation] 🔴 RED DOT RENDERED', {
                  itemLabel: item.name,
                  itemPath: item.path,
                  hasNotification: item.hasNotification,
                  timestamp: new Date().toISOString()
                })}
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNavigation;
