
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import EnhancedSecureLoginForm from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';
import { SecurityHeaders } from '@/components/Auth/SecurityHeaders';

const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <>
        <SecurityHeaders />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SecurityHeaders />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* Polygon Logo */}
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
    </>
  );
};

export default LoginPage;
