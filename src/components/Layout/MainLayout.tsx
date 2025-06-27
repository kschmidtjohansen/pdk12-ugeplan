
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Simple authentication check without competing mechanisms
  React.useEffect(() => {
    if (!loading && !isAuthenticated && 
        location.pathname !== "/login" && 
        location.pathname !== "/password-reset") {
      
      console.log(`[MainLayout] Redirecting unauthenticated user to login`);
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  // Don't show layout for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        {children}
      </SecurityErrorBoundary>
    );
  }

  // Simple loading state
  if (loading) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated) {
    return (
      <SecurityErrorBoundary>
        <SecurityHeaders />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </SecurityErrorBoundary>
    );
  }

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
