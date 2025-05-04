
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Search, Users, Car, Clock, Calendar, Menu, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { NavigationItem } from '../../types/navigation';
import { NotificationType } from '../../types/notification';

// Import custom components
import Logo from './NavComponents/Logo';
import DesktopNavigation from './NavComponents/DesktopNavigation';
import MobileNavigation from './NavComponents/MobileNavigation';
import NotificationsDropdown from './NavComponents/NotificationsDropdown';
import UserMenu from './NavComponents/UserMenu';

const TopNavbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
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

  const handleNotificationClick = (notification: NotificationType) => {
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
            <Logo />
            <DesktopNavigation items={filteredNavItems} />
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
                <NotificationsDropdown 
                  notifications={notifications}
                  unreadCount={unreadCount}
                  markAllAsRead={markAllAsRead}
                  handleNotificationClick={handleNotificationClick}
                  clearNotification={clearNotification}
                />
              </div>
            )}
            
            {/* User dropdown */}
            <div className="hidden md:ml-4 md:flex md:items-center">
              <UserMenu 
                user={user}
                currentLanguage={currentLanguage}
                setLanguage={setLanguage}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <MobileNavigation 
        items={filteredNavItems}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        isAdmin={isAdmin}
        notifications={notifications}
        unreadCount={unreadCount}
        handleNotificationClick={handleNotificationClick}
        clearNotification={clearNotification}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        handleLogout={handleLogout}
      />
    </nav>
  );
};

export default TopNavbar;
