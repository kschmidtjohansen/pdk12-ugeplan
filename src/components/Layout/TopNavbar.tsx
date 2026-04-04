
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
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
import ChangeLogDropdown from './NavComponents/ChangeLogDropdown';
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
  
  if (import.meta.env.DEV) console.log('[TopNavbar] 🔔 VACATION REQUESTS STATUS', {
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
        if (import.meta.env.DEV) console.log('[TopNavbar] 📢 Showing pending vacation requests notification', { pendingCount });
        
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
      // Fuld page reload så alle contexts starter forfra
      window.location.href = '/login';
    } catch (error) {
      if (import.meta.env.DEV) console.error('Logout error:', error);
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
  
  if (import.meta.env.DEV) console.log('[TopNavbar] 📋 NAVIGATION ITEMS', {
    hasPendingRequests,
    vacationItem: navigationItems.find(item => item.path === '/vacation'),
    allItemsWithNotifications: navigationItems.filter(item => item.hasNotification),
    timestamp: new Date().toISOString()
  });
  
  const { isDutyEnabled, isWarehouseEnabled } = useDepartment();
  
  const filteredNavItems = navigationItems.filter(item => {
    if (item.adminOnly && !isEffectiveAdmin) return false;
    if (item.path === '/duty' && !isDutyEnabled) return false;
    if (item.path === '/warehouse' && !isWarehouseEnabled) return false;
    return true;
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 navbar-height">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-14">
          {/* Logo + Department Selector - Left */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Logo />
            <div className="hidden md:flex">
              <DepartmentSelector />
            </div>
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
                className="inline-flex items-center justify-center p-2 rounded-xl text-foreground hover:text-foreground hover:bg-muted focus:outline-none transition-colors duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* Notifications - Desktop */}
            <div className="hidden md:flex md:items-center md:gap-2 overflow-visible">
              <NotificationsDropdown 
                notifications={notifications.slice(0, 10)}
                unreadCount={unreadCount}
                markAllAsRead={markAllAsRead}
                handleNotificationClick={handleNotificationClick}
                clearNotification={deleteNotification}
              />
              {(isEffectiveAdmin || user?.role === 'skadeleder') && (
                <ChangeLogDropdown />
              )}
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
