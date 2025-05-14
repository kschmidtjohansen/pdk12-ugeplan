
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
import NavigationItems from './NavigationItems';

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
  
  // Track if there are vacation-related notifications that need attention
  const [hasVacationNotifications, setHasVacationNotifications] = useState(false);
  
  // Check for vacation-related notifications
  useEffect(() => {
    // Enhanced check for vacation notifications
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
    
    console.log('TopNavbar: Checking vacation notifications:', { 
      hasVacation, 
      count: vacationNotifications.length,
      notificationIds: vacationNotifications.map(n => n.id).join(',').substring(0, 100), // Limit output length
      messages: vacationNotifications.map(n => n.message).slice(0, 3) // Only show first 3
    });
    
    setHasVacationNotifications(hasVacation);
  }, [notifications]);

  const handleLogout = () => {
    logout();
    toast({
      title: t('common.success'),
      description: t('login.logoutSuccess')
    });
    navigate('/login');
  };

  const handleNotificationClick = (notification: NotificationType) => {
    console.log('TopNavbar: Notification clicked:', notification);
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Don't show navbar for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return null;
  }

  // Debug log for navigation items and notification status
  console.log('TopNavbar rendering with user:', { 
    userId: user?.id,
    role: user?.role,
    isAdmin: user?.role === 'administrator',
    hasVacationNotifications,
    unreadCount,
    notificationCount: notifications.length
  });

  // Filter items based on user role
  const navigationItems = NavigationItems({ hasVacationNotifications });
  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || user?.role === 'administrator'
  );

  const isAdmin = user?.role === 'administrator';

  if (!isAuthenticated) {
    return null;
  }

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
            
            {/* Notifications - Desktop - Show for all users */}
            <div className="hidden md:flex md:items-center md:ml-2">
              <NotificationsDropdown 
                notifications={notifications.slice(0, 10)} // Limit to 10 notifications for better performance
                unreadCount={unreadCount}
                markAllAsRead={markAllAsRead}
                handleNotificationClick={handleNotificationClick}
                clearNotification={deleteNotification}
              />
            </div>
            
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
        notifications={notifications.slice(0, 10)} // Limit to 10 notifications
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
