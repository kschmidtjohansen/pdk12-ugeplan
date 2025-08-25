import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const VagtplanViewer: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get OneDrive embed URL from environment
  const oneDriveEmbedUrl = import.meta.env.VITE_ONEDRIVE_EMBED_URL || '';

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by updating its key
    const iframe = document.getElementById('vagtplan-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  if (!oneDriveEmbedUrl) {
    return (
      <div className="p-8 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            OneDrive embed URL not configured. Please add your Excel file's embed URL to the environment configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">{t("vagtplan.loading")}</span>
        </div>
      )}

      {hasError && (
        <div className="p-8 text-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mb-4">
              {t("vagtplan.error")}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("vagtplan.retry")}
          </Button>
        </div>
      )}

      <iframe
        id="vagtplan-iframe"
        src={oneDriveEmbedUrl}
        className={`w-full border-0 rounded-lg ${isLoading || hasError ? 'hidden' : 'block'}`}
        style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={t("vagtplan.title")}
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow="fullscreen"
      />
    </div>
  );
};

export default VagtplanViewer;