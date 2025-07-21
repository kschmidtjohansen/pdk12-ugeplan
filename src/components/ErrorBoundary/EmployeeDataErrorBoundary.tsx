
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface EmployeeDataErrorBoundaryProps {
  error: string;
  onRetry: () => void;
  loading: boolean;
}

const EmployeeDataErrorBoundary: React.FC<EmployeeDataErrorBoundaryProps> = ({
  error,
  onRetry,
  loading
}) => {
  const { t } = useTranslation();

  // Determine error type and provide appropriate messaging
  const getErrorInfo = (errorMessage: string) => {
    if (errorMessage.includes('infinite recursion')) {
      return {
        title: t('employees.rlsErrorTitle'),
        description: t('employees.rlsErrorDescription'),
        severity: 'destructive' as const
      };
    } else if (errorMessage.includes('Authentication required')) {
      return {
        title: t('auth.sessionExpiredTitle'),
        description: t('auth.sessionExpiredDescription'),
        severity: 'destructive' as const
      };
    } else if (errorMessage.includes('permission denied')) {
      return {
        title: t('employees.permissionErrorTitle'),
        description: t('employees.permissionErrorDescription'),
        severity: 'destructive' as const
      };
    } else {
      return {
        title: t('employees.generalErrorTitle'),
        description: t('employees.generalErrorDescription'),
        severity: 'destructive' as const
      };
    }
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="p-4">
      <Alert variant={errorInfo.severity}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{errorInfo.title}</AlertTitle>
        <AlertDescription className="mt-2">
          {errorInfo.description}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={onRetry}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.retrying')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('common.retry')}
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmployeeDataErrorBoundary;
