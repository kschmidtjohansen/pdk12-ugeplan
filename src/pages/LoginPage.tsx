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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-6">
            <img
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
              alt="Polygon Logo"
              className="h-16 mx-auto mb-4"
              width="240"
              height="64"
            />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
            {t('login.welcomeMessage')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('login.loginSubtext')}
          </p>
          {departmentName && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {departmentName}
            </p>
          )}
        </div>

        <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};
export default LoginPage;
