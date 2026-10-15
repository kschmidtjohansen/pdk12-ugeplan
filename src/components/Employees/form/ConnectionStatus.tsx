import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

export type CreationMethod = 'attempting' | 'edge-function' | 'direct-database' | 'failed';

const ConnectionStatus: React.FC<{ isSubmitting: boolean; creationMethod: CreationMethod }> = ({ isSubmitting, creationMethod }) => {
  const { t } = useTranslation();
    if (!isSubmitting) return null;
  switch (creationMethod) {
    case 'attempting':
      return <Alert className="mb-4">
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            {t('employees.creatingUserDescription')}
          </AlertDescription>
        </Alert>;
    case 'edge-function':
      return <Alert className="mb-4">
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            {t('employees.userCreatedSuccessfully')}
          </AlertDescription>
        </Alert>;
    case 'direct-database':
      return <Alert className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            {t('employees.userCreatedFallback')}
          </AlertDescription>
        </Alert>;
    case 'failed':
      return <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('employees.userCreationFailed')}
          </AlertDescription>
        </Alert>;
    default:
      return null;
  }
};

export default ConnectionStatus;
