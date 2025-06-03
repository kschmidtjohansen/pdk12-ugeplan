
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import TopNavbar from './TopNavbar';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show layout for login page or password reset page
  if (location.pathname === "/login" || location.pathname === "/password-reset") {
    return <Outlet />;
  }

  // If not authenticated, redirect to login instead of showing access denied
  if (!isAuthenticated) {
    React.useEffect(() => {
      navigate('/login', { replace: true });
    }, [navigate]);
    
    // Show a loading state while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <TopNavbar />
      
      {/* Main Content with modern background */}
      <main className="flex-1 page-container w-full max-w-full">
        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
