
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { NotificationType } from '@/types/notification';
import { useVacationRequestsStatus } from '@/hooks/vacation/useVacationRequestsStatus';

// Import custom components
import Logo from './NavComponents/Logo';
import DesktopNavigation from './NavComponents/DesktopNavigation';
import MobileNavigation from './NavComponents/MobileNavigation';
import NotificationsDropdown from './NavComponents/NotificationsDropdown';
import UserMenu from './NavComponents/UserMenu';
import { getNavigationItems } from './NavigationItems';

const TopNavbar: React.FC = () => {
  const { isAuthenticated, user, logout, isEffectiveAdmin, userDataLoaded } = useAuth();
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
  
  // Use vacation requests status hook instead of notification-based logic
  const { hasPendingRequests, pendingCount } = useVacationRequestsStatus();
  
  console.log('[TopNavbar] 🔔 VACATION REQUESTS STATUS', {
    hasPendingRequests,
    pendingCount,
    isEffectiveAdmin,
    timestamp: new Date().toISOString()
  });

  // Show pending vacation requests notification for admins on each login session
  useEffect(() => {
    if (isEffectiveAdmin && hasPendingRequests && userDataLoaded) {
      const noticeShown = sessionStorage.getItem('vacation-notice-shown');
      
      if (!noticeShown) {
        console.log('[TopNavbar] 📢 Showing pending vacation requests notification', { pendingCount });
        
        toast({
          title: t('vacation.pendingRequestsTitle') || 'Der er afventende anmodninger',
          description: `${pendingCount} ${t('vacation.pendingRequestsDescription') || 'fridags-anmodning(er) venter på godkendelse'}`,
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/vacation')}
            >
              {t('vacation.openVacationPage') || 'Åbn Fridage'}
            </Button>
          ),
          duration: 10000, // Show for 10 seconds
        });
        
        sessionStorage.setItem('vacation-notice-shown', '1');
      }
    }
    
    // Clear the notice flag when there are no pending requests
    if (!hasPendingRequests) {
      sessionStorage.removeItem('vacation-notice-shown');
    }
  }, [isEffectiveAdmin, hasPendingRequests, pendingCount, userDataLoaded, toast, t, navigate]);

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
        description: t('auth.logoutFailed'),
        variant: 'destructive'
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

  const navigationItems = getNavigationItems(hasPendingRequests);
  
  console.log('[TopNavbar] 📋 NAVIGATION ITEMS', {
    hasPendingRequests,
    vacationItem: navigationItems.find(item => item.path === '/vacation'),
    allItemsWithNotifications: navigationItems.filter(item => item.hasNotification),
    timestamp: new Date().toISOString()
  });
  
  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || isEffectiveAdmin
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-soft navbar-height">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-20">
          {/* Logo - Far Left */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Desktop Navigation - Absolutely Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <DesktopNavigation items={filteredNavItems} />
          </div>
          
          {/* User profile and mobile menu button - Far Right */}
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
        isAdmin={isEffectiveAdmin}
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
