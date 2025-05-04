
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
        
        {/* Notifications - Mobile */}
        {isAdmin && notifications.length > 0 && (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-polygon-purple text-white">
                    {unreadCount}
                  </Badge>
                )}
              </span>
            </div>
            {notifications.slice(0, 3).map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "p-2 text-sm rounded-md mb-1 cursor-pointer",
                  !notification.read && "bg-muted"
                )}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNotificationClick(notification);
                }}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="text-xs text-muted-foreground">
                  {format(notification.date, 'PPp')}
                </div>
              </div>
            ))}
            <Link 
              to="/vacation"
              className="block text-xs text-polygon-purple hover:underline mt-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('notifications.viewAll')}
            </Link>
          </div>
        )}
        
        {/* Mobile user info and logout */}
        <div className="border-t border-gray-200 pt-4 pb-3">
          <div className="flex items-center px-3">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10 profile-avatar">
                <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user?.name}</div>
              <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              <div className="text-sm font-medium text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1 px-2">
            {/* Language Switcher in Mobile Menu */}
            <div className="px-3 py-2">
              <span className="block text-sm font-medium text-gray-500 mb-2">{t('common.language')}</span>
              <div className="flex space-x-2">
                {Object.entries(languageNames).map(([code, name]) => (
                  <Button
                    key={code}
                    variant={currentLanguage === code ? "default" : "outline"}
                    size="sm"
                    className="text-sm"
                    onClick={() => setLanguage(code as 'en' | 'da')}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-gray-700 justify-start"
              onClick={handleLogout}
            >
              <svg className="mr-3 h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
