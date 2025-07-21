
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, LogIn } from 'lucide-react';

interface EmployeeLoadingErrorProps {
  error: string;
  onRetry: () => void;
  loading: boolean;
}

const EmployeeLoadingError: React.FC<EmployeeLoadingErrorProps> = ({
  error,
  onRetry,
  loading
}) => {
  const { t } = useTranslation();

  const isAuthError = error.includes('Authentication') || 
                     error.includes('session') || 
                     error.includes('expired');

  const handleRefreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-lg font-semibold">
          {t('employees.fetchError') || 'Error loading employees'}
        </AlertTitle>
        <AlertDescription className="mt-3 space-y-4">
          <p className="text-sm text-gray-600">
            {isAuthError 
              ? (t('auth.sessionExpired') || 'Your session has expired. Please refresh the page to continue.')
              : (t('employees.generalErrorDescription') || 'An error occurred while loading employee data.')
            }
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.retrying') || 'Retrying...'}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('common.retry') || 'Try Again'}
                </>
              )}
            </Button>
            
            {isAuthError && (
              <Button
                onClick={handleRefreshPage}
                size="sm"
                variant="default"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('common.refresh') || 'Refresh Page'}
              </Button>
            )}
          </div>
          
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Technical details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error}
            </pre>
          </details>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmployeeLoadingError;
