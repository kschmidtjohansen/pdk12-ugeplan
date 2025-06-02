
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="flex items-center justify-center min-h-screen bg-polygon-lightgray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-polygon-blue mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-polygon-lightgray">
      <TopNavbar />
      
      {/* Main Content - Adjusted to ensure full width and proper padding for navbar */}
      <main className="flex-1 page-container w-full max-w-full mt-16 px-4 pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
