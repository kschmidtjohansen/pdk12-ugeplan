
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

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      if (import.meta.env.DEV) console.log('[MainLayout] SESSION EXPIRATION FIX - User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [authReady, isAuthenticated, navigate]);

  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        {children}
      </SecurityErrorBoundary>
    );
  }

  if (!isInitialized || !authReady) {
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground text-sm">{loadingText}</p>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground text-sm">Redirecting to login...</p>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }

  return (
    <SecurityErrorBoundary>
      <SecurityHeaders />
      {/* Animated mesh background */}
      <div className="mesh-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      
      <div className="flex flex-col min-h-screen w-full relative z-10">
        <TopNavbar />
        <RealtimeChangeNotifier />
        
        <main className="flex-1 w-full pt-12">
          <PullToRefresh onRefresh={handlePullRefresh}>
            <div className="max-w-7xl mx-auto p-4 lg:p-6">
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
