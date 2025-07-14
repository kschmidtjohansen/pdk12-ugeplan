
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { SecurityHeaders } from '@/components/Auth/SecurityHeaders';
import { SecurityErrorBoundary } from '@/components/Layout/SecurityErrorBoundary';
import TopNavbar from './TopNavbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { t, isInitialized } = useTranslation();

  console.log('[MainLayout] Render - path:', location.pathname, 'isAuthenticated:', isAuthenticated, 'loading:', loading, 'translationInitialized:', isInitialized);

  // Don't show layout for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        {children}
      </SecurityErrorBoundary>
    );
  }

  // Show loading state if translation is not initialized or auth is loading
  if (loading || !isInitialized) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }

  // If not authenticated, show simple redirect message
  if (!isAuthenticated) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
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
        
        <main className="flex-1 w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 pt-20">
          <div className="animate-fade-in-up w-full">
            <SecurityErrorBoundary>
              {children}
            </SecurityErrorBoundary>
          </div>
        </main>
      </div>
    </SecurityErrorBoundary>
  );
};

export default MainLayout;
