
import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { SecurityHeaders } from '@/components/Auth/SecurityHeaders';
import { SecurityErrorBoundary } from '@/components/Layout/SecurityErrorBoundary';
import AppShell from './AppShell';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { RealtimeChangeNotifier } from '@/components/shared/RealtimeChangeNotifier';
import { useQueryClient } from '@tanstack/react-query';
import { notifyOwnAction } from '@/lib/realtimeUtils';
import ListSkeleton from '@/components/shared/ListSkeleton';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, isInitialized } = useTranslation();
  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  // Auto-refresh data on route changes so users always see fresh data without
  // needing to dismiss the realtime "Opdater"-banner. Only the datasets the new
  // route actually renders are refreshed, and only the queries currently mounted
  // (refetchType: 'active') — refetching everything on every navigation made
  // switching between dashboard and planner unnecessarily slow.
  useEffect(() => {
    if (!isAuthenticated) return;

    const path = location.pathname;
    const keysByRoute: { match: (p: string) => boolean; keys: string[] }[] = [
      { match: (p) => p.startsWith('/dashboard'), keys: ['assignments', 'employees', 'cars', 'vacations', 'duties'] },
      { match: (p) => p.startsWith('/planner'), keys: ['assignments', 'employees', 'cars', 'vacations'] },
      { match: (p) => p.startsWith('/employees'), keys: ['employees', 'vacations'] },
      { match: (p) => p.startsWith('/cars'), keys: ['cars'] },
      { match: (p) => p.startsWith('/vacation'), keys: ['vacations', 'employees'] },
      { match: (p) => p.startsWith('/duty'), keys: ['duties', 'employees'] },
    ];

    const keys = keysByRoute.find((entry) => entry.match(path))?.keys;
    if (!keys?.length) return;

    notifyOwnAction();
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
    });
  }, [location.pathname, isAuthenticated, queryClient]);

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
        <div className="min-h-screen bg-background" aria-label={loadingText}>
          <ListSkeleton />
        </div>
      </SecurityErrorBoundary>
    );
  }


  // SESSION EXPIRATION FIX: Remove infinite redirect state - if auth is ready and not authenticated, the useEffect will handle redirect
  if (!isAuthenticated) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="min-h-screen bg-background" aria-label="Redirecting to login...">
          <ListSkeleton />
        </div>
      </SecurityErrorBoundary>
    );
  }


  // Show main layout for authenticated users
  return (
    <SecurityErrorBoundary>
      <SecurityHeaders />
      <AppShell>
        <RealtimeChangeNotifier />
        <PullToRefresh onRefresh={handlePullRefresh}>
          <div className="w-full">
            <SecurityErrorBoundary>
              {children}
            </SecurityErrorBoundary>
          </div>
        </PullToRefresh>
      </AppShell>
    </SecurityErrorBoundary>
  );
};

export default MainLayout;
