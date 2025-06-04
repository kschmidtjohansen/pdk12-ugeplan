
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { Menu, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { NotificationType } from '@/types/notification';

// Import custom components
import Logo from './NavComponents/Logo';
import DesktopNavigation from './NavComponents/DesktopNavigation';
import MobileNavigation from './NavComponents/MobileNavigation';
import NotificationsDropdown from './NavComponents/NotificationsDropdown';
import UserMenu from './NavComponents/UserMenu';
import { getNavigationItems } from './NavigationItems';

const TopNavbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    fetchNotifications 
  } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [hasVacationNotifications, setHasVacationNotifications] = useState(false);
  
  // Check for vacation-related notifications
  useEffect(() => {
    const vacationNotifications = notifications.filter(
      n => !n.read && (
        n.type === 'vacation' || 
        n.link?.includes('/vacation') ||
        (n.message && (
          n.message.includes('vacation') || 
          n.message.includes('ferie')
        ))
      )
    );
    
    const hasVacation = vacationNotifications.length > 0;
    setHasVacationNotifications(hasVacation);
  }, [notifications]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('common.success'),
        description: t('login.logoutSuccess')
      });
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t('common.error'),
        description: 'Logout failed'
      });
    }
  };

  const handleNotificationClick = (notification: NotificationType) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Don't show navbar for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return null;
  }

  const navigationItems = getNavigationItems(hasVacationNotifications);
  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || user?.role === 'administrator'
  );

  const isAdmin = user?.role === 'administrator';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-soft navbar-height">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and desktop navigation with proper spacing */}
          <div className="flex items-center space-x-6">
            <Logo />
            <DesktopNavigation items={filteredNavItems} />
          </div>
          
          {/* User profile and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* Notifications - Desktop */}
            <div className="hidden md:flex md:items-center">
              <NotificationsDropdown 
                notifications={notifications.slice(0, 10)}
                unreadCount={unreadCount}
                markAllAsRead={markAllAsRead}
                handleNotificationClick={handleNotificationClick}
                clearNotification={deleteNotification}
              />
            </div>
            
            {/* User dropdown */}
            <div className="hidden md:flex md:items-center">
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
        notifications={notifications.slice(0, 10)}
        unreadCount={unreadCount}
        handleNotificationClick={handleNotificationClick}
        clearNotification={deleteNotification}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        handleLogout={handleLogout}
      />
    </nav>
  );
};

export default TopNavbar;
