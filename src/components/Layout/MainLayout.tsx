
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import TopNavbar from './TopNavbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Always call useTranslation hook - never conditionally
  const { t } = useTranslation();

  // Always call useEffect - never conditionally
  React.useEffect(() => {
    // Only redirect if not authenticated and not on login/password-reset pages
    if (!isAuthenticated && !loading && 
        location.pathname !== "/login" && 
        location.pathname !== "/password-reset") {
      console.log(`[MainLayout] Redirecting unauthenticated user to login on domain: ${window.location.hostname}`);
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  // Don't show layout for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return <>{children}</>;
  }

  // Show enhanced loading state while authentication is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
          {window.location.hostname.includes('pdk12.dk') && (
            <p className="text-sm text-gray-500">Connecting to pdk12.dk...</p>
          )}
        </div>
      </div>
    );
  }

  // If not authenticated, show brief loading state while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <TopNavbar />
      
      {/* Main Content with top padding to account for fixed navbar */}
      <main className="flex-1 w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 pt-20">
        <div className="animate-fade-in-up w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
