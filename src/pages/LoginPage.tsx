import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecureLoginForm } from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';

const LoginPage = () => {
  const {
    isAuthenticated,
    authReady,
    session,
    userDataLoaded
  } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const departmentName = localStorage.getItem('selected_department_name');

  // Only redirect if auth is ready, user is authenticated, and user data is loaded
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[LoginPage] Auth state:', { isAuthenticated, authReady, session: !!session, userDataLoaded });
    }
    if (authReady && isAuthenticated && session && userDataLoaded) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authReady, session, userDataLoaded, navigate]);

  const handleLoginSuccess = () => {
    // Navigation will be handled by the useEffect above when session is available
  };

  return <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg" 
              alt="Polygon Logo" 
              className="h-12 mx-auto mb-4"
              width="180"
              height="48"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('login.welcomeMessage')}
          </h1>
          <p className="text-muted-foreground">
            {departmentName || t('login.internalSystem')}
          </p>
        </div>
        
        <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>;
};
export default LoginPage;