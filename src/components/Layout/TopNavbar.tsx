
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { useNotifications } from '../../context/NotificationContext';
import { languageNames } from '../../translations';
import { 
  Search, 
  Users, 
  Car, 
  LogIn, 
  Clock,
  Calendar,
  Menu,
  X,
  Settings,
  Bell,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuFooter
} from "@/components/ui/dropdown-menu";

// Type definitions for navigation items
interface NavigationItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  translationKey: string;
}

const TopNavbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    clearNotification
  } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: t('common.success'),
      description: t('login.success')
    });
    navigate('/');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Don't show navbar for login page
  if (location.pathname === "/") {
    return null;
  }

  const navigationItems: NavigationItem[] = [
    { path: '/dashboard', name: t('navigation.dashboard'), translationKey: 'navigation.dashboard', icon: <Search className="h-5 w-5" /> },
    { path: '/planner', name: t('navigation.planner'), translationKey: 'navigation.planner', icon: <Clock className="h-5 w-5" /> },
    { path: '/employees', name: t('navigation.employees'), translationKey: 'navigation.employees', icon: <Users className="h-5 w-5" /> },
    { path: '/cars', name: t('navigation.cars'), translationKey: 'navigation.cars', icon: <Car className="h-5 w-5" /> },
    { path: '/vacation', name: t('navigation.vacation'), translationKey: 'navigation.vacation', icon: <Calendar className="h-5 w-5" /> },
    { path: '/admin', name: t('navigation.admin'), translationKey: 'navigation.admin', icon: <Settings className="h-5 w-5" />, adminOnly: true },
  ];

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Filter items based on user role
  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || user?.role === 'administrator'
  );

  const isAdmin = user?.role === 'administrator';

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white shadow-md navbar-height">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <img 
                src="/lovable-uploads/logo-polygon.png" 
                alt="Polygon Logo" 
                className="polygon-logo"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {filteredNavItems.map((item) => (
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
          </div>
          
          {/* User profile and mobile menu button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-polygon-lightgray focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* Notifications - Desktop */}
            {isAdmin && (
              <div className="hidden md:flex md:items-center md:ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-polygon-red text-white">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>{t('notifications.title')}</span>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="text-xs h-7"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          {t('notifications.markAllAsRead')}
                        </Button>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          {t('notifications.noNotifications')}
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <DropdownMenuItem 
                            key={notification.id} 
                            className={cn(
                              "flex flex-col items-start p-3 cursor-pointer gap-1",
                              !notification.read && "bg-muted"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex justify-between w-full">
                              <span className="font-medium">{notification.title}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm">{notification.message}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(notification.date, 'PPpp')}
                            </span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <DropdownMenuFooter className="text-center">
                        <Link 
                          to="/vacation" 
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {t('notifications.viewAll')}
                        </Link>
                      </DropdownMenuFooter>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* User dropdown */}
            <div className="hidden md:ml-4 md:flex md:items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9 profile-avatar">
                      <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Language Selector */}
                  <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={currentLanguage} onValueChange={(val) => setLanguage(val as 'en' | 'da')}>
                    {Object.entries(languageNames).map(([code, name]) => (
                      <DropdownMenuRadioItem 
                        key={code} 
                        value={code}
                        className="cursor-pointer"
                      >
                        {name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogIn className="mr-2 h-4 w-4 rotate-180" />
                    <span>{t('common.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium flex items-center",
                  location.pathname === item.path 
                    ? "bg-polygon-blue text-white" 
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
                      <Badge className="ml-2 bg-polygon-red text-white">
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
                  className="block text-xs text-blue-600 hover:underline mt-1"
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
                  <LogIn className="mr-3 h-5 w-5 rotate-180" /> 
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNavbar;
