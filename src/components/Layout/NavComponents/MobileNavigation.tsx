
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Bell, Phone, Mail } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { NavigationItem } from '../../../types/navigation';
import { useTranslation } from '@/context/TranslationContext';
import { NotificationType } from '../../../types/notification';
import { languageNames } from '../../../translations';

interface MobileNavigationProps {
  items: NavigationItem[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: any;
  isAdmin: boolean;
  notifications: NotificationType[];
  unreadCount: number;
  handleNotificationClick: (notification: NotificationType) => void;
  clearNotification: (id: string) => void;
  currentLanguage: string;
  setLanguage: (lang: any) => void;
  handleLogout: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  items, 
  mobileMenuOpen,
  setMobileMenuOpen,
  user,
  isAdmin,
  notifications,
  unreadCount,
  handleNotificationClick,
  clearNotification,
  currentLanguage,
  setLanguage,
  handleLogout
}) => {
  const location = useLocation();
  const { t } = useTranslation();

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!mobileMenuOpen) return null;
  
  return (
    <div className="md:hidden bg-white">
      <div className="px-2 pt-2 pb-3 space-y-1">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "block px-3 py-2 rounded-md text-base font-medium flex items-center",
              location.pathname === item.path 
                ? "bg-polygon-purple text-white" 
                : "text-gray-700 hover:bg-polygon-lightgray"
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
        
        {/* User profile */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-5">
            <div className="flex-shrink-0">
              <Avatar>
                <AvatarFallback>{user ? getInitials(user.name || '') : '?'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user?.name}</div>
              <div className="text-sm font-medium text-gray-500">{user?.email}</div>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto flex-shrink-0 p-1"
              >
                <span className="sr-only">{t('notifications.title')}</span>
                <Bell className="h-5 w-5 text-gray-500" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 flex items-center justify-center h-4 w-4 text-[10px] p-0"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
          
          <div className="mt-3 space-y-1 px-2">
            {/* Language selector */}
            <div className="flex items-center px-3 py-2 text-gray-700">
              <span className="mr-2">{t('common.language')}:</span>
              <div className="flex gap-2">
                <Button 
                  variant={currentLanguage === 'en' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setLanguage('en')}
                >
                  EN
                </Button>
                <Button 
                  variant={currentLanguage === 'da' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setLanguage('da')}
                >
                  DA
                </Button>
              </div>
            </div>
            
            {/* Logout button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="w-full justify-start px-3 py-2 text-base"
            >
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
