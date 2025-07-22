
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecureLoginForm } from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';

const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clientTimeout, setClientTimeout] = useState(false);

  console.log('[LoginPage] SIMPLIFIED - Render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // SIMPLIFIED: Shorter timeout for better UX
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[LoginPage] SIMPLIFIED - Client timeout reached after 5 seconds');
      setClientTimeout(true);
    }, 5000); // Reduced to 5 seconds

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log('[LoginPage] SIMPLIFIED - User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLoginSuccess = () => {
    console.log('[LoginPage] SIMPLIFIED - Login success callback triggered');
    // The auth state change will handle navigation automatically
  };

  // Show loading state with timeout protection
  if (loading && !clientTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show redirect message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show timeout message with retry option
  if (clientTimeout && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Login is taking longer than expected</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry Login
          </button>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg" 
              alt="Polygon Logo" 
              className="h-12 mx-auto mb-4"
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
      </div>
    </div>
  );
};

export default LoginPage;
