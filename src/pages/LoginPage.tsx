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
  const {
    t
  } = useTranslation();
  console.log('[LoginPage] REDIRECTION FIX - Render state:', {
    isAuthenticated,
    authReady,
    session: !!session,
    userDataLoaded
  });

  // Only redirect if auth is ready and user is authenticated
  useEffect(() => {
    console.log('[LoginPage] REDIRECTION FIX - Auth state:', {
      isAuthenticated,
      authReady,
      session: !!session,
      userDataLoaded
    });
    if (authReady && isAuthenticated && session) {
      console.log('[LoginPage] REDIRECTION FIX - User authenticated, redirecting to dashboard');
      navigate('/dashboard', {
        replace: true
      });
    }
  }, [isAuthenticated, authReady, session, userDataLoaded, navigate]);
  const handleLoginSuccess = () => {
    console.log('[LoginPage] REDIRECTION FIX - Login success callback triggered');
    // Navigation will be handled by the useEffect above when session is available
  };

  // Show login form - don't block it with auth checks
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('login.welcomeMessage')}
          </h1>
          <p className="text-gray-600">
            {t('login.internalSystem')}
          </p>
        </div>
        
        <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />
        
        {/* Debug info in dev mode */}
        {process.env.NODE_ENV === 'development'}
      </div>
    </div>;
};
export default LoginPage;