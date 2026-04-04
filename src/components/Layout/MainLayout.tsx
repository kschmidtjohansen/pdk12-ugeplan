
import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { SecurityHeaders } from '@/components/Auth/SecurityHeaders';
import { SecurityErrorBoundary } from '@/components/Layout/SecurityErrorBoundary';
import TopNavbar from './TopNavbar';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { RealtimeChangeNotifier } from '@/components/shared/RealtimeChangeNotifier';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isInitialized } = useTranslation();
  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);
  if (import.meta.env.DEV) console.log('[MainLayout] SESSION EXPIRATION FIX - Render state:', {
    path: location.pathname,
    isAuthenticated,
    authReady,
    translationInitialized: isInitialized
  });

  // SESSION EXPIRATION FIX: Active redirect when not authenticated
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      if (import.meta.env.DEV) console.log('[MainLayout] SESSION EXPIRATION FIX - User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [authReady, isAuthenticated, navigate]);


  // Don't show layout for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        {children}
      </SecurityErrorBoundary>
    );
  }


  // Show loading state if translation is not initialized or auth is not ready
  if (!isInitialized || !authReady) {
    // Use browser language detection for loading screen
    const getBrowserLanguage = () => {
      const lang = navigator.language || (navigator as any).userLanguage || '';
      return lang.startsWith('da') ? 'da' : 'en';
    };
    
    const loadingText = getBrowserLanguage() === 'da' 
      ? 'Indlæser applikation...' 
      : 'Loading application...';
    
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-muted/50 to-muted">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">{loadingText}</p>
            <div className="text-xs text-muted-foreground/60">
              Translation: {isInitialized ? 'Ready' : 'Loading'} | Auth: {authReady ? 'Ready' : 'Initializing'}
            </div>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }


  // SESSION EXPIRATION FIX: Remove infinite redirect state - if auth is ready and not authenticated, the useEffect will handle redirect
  if (!isAuthenticated) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-muted/50 to-muted">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }


  // Show main layout for authenticated users
  return (
    <SecurityErrorBoundary>
      <SecurityHeaders />
      <div className="flex flex-col min-h-screen w-full">
        <TopNavbar />
        <RealtimeChangeNotifier />
        
        <main className="flex-1 w-full bg-[#f8fafc] dark:bg-slate-950 pt-14">
          <PullToRefresh onRefresh={handlePullRefresh}>
            <div className="animate-fade-in-up w-full">
              <SecurityErrorBoundary>
                {children}
              </SecurityErrorBoundary>
            </div>
          </PullToRefresh>
        </main>
      </div>
    </SecurityErrorBoundary>
  );
};

export default MainLayout;
