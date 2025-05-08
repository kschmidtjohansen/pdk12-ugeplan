
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

  // Don't show layout for login page
  if (location.pathname === "/") {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-polygon-lightgray">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('accessDenied.title')}</h1>
          <p className="mb-4">{t('accessDenied.message')}</p>
          <Button onClick={() => navigate('/')}>
            <LogIn className="mr-2 h-4 w-4" /> {t('common.login')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-polygon-lightgray">
      <TopNavbar />
      
      {/* Main Content - Adjusted to ensure full width */}
      <main className="flex-1 page-container w-full max-w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
