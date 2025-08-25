import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { AlertCircle, RefreshCw, ExternalLink, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useVagtplanAccess } from '@/utils/vagtplanPermissions';

const VagtplanViewer: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Get OneDrive embed URL from environment
  const oneDriveEmbedUrl = import.meta.env.VITE_ONEDRIVE_EMBED_URL || '';
  
  // Check user permissions
  const accessCheck = useVagtplanAccess();

  // Debug logging
  console.log('🎭 VagtplanViewer render:', {
    accessCheck,
    oneDriveEmbedUrl: oneDriveEmbedUrl ? 'configured' : 'missing',
    isLoading,
    hasError,
    showFallback
  });

  useEffect(() => {
    // Auto-show fallback after 10 seconds if still loading
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        setShowFallback(true);
      }
    }, 10000);

    return () => clearTimeout(fallbackTimer);
  }, [isLoading]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    setIframeError(true);
    setShowFallback(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeError(false);
    setShowFallback(false);
    // Force iframe reload by updating its key
    const iframe = document.getElementById('vagtplan-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    // Open the direct SharePoint URL
    const directUrl = oneDriveEmbedUrl.replace('&action=embedview', '');
    window.open(directUrl, '_blank');
  };

  const handleShowFallback = () => {
    setShowFallback(true);
  };

  // Check for configuration
  if (!oneDriveEmbedUrl) {
    return (
      <div className="p-8 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("vagtplan.configurationError")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check user permissions
  if (!accessCheck.hasAccess) {
    return (
      <div className="p-8 text-center space-y-4">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {t("vagtplan.accessDenied")}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {t("vagtplan.accessDeniedMessage")}
          </p>
          
          <div className="flex justify-center gap-2">
            <Button onClick={handleOpenExternal} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("vagtplan.openInSharePoint")}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t("vagtplan.contactAdmin")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Access granted indicator */}
      <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-center gap-2 text-success">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">{t("vagtplan.accessGranted")}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {accessCheck.message}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">{t("vagtplan.loading")}</span>
          {!showFallback && (
            <Button 
              onClick={handleShowFallback} 
              variant="ghost" 
              size="sm" 
              className="ml-4"
            >
              {t("vagtplan.showAlternatives")}
            </Button>
          )}
        </div>
      )}

      {(hasError || showFallback) && (
        <div className="p-6 text-center space-y-4">
          {hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {iframeError ? t("vagtplan.embedError") : t("vagtplan.error")}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <h4 className="font-medium">{t("vagtplan.alternativeAccess")}</h4>
            
            <div className="flex justify-center gap-3 flex-wrap">
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("vagtplan.retry")}
              </Button>
              
              <Button onClick={handleOpenExternal} variant="default" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("vagtplan.openInSharePoint")}
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{t("vagtplan.troubleshootingTip")}</p>
              <p className="text-xs">{t("vagtplan.organizationalRestriction")}</p>
            </div>
          </div>
        </div>
      )}

      <iframe
        id="vagtplan-iframe"
        src={oneDriveEmbedUrl}
        className={`w-full border-0 rounded-lg transition-opacity ${
          isLoading || hasError ? 'hidden' : 'block'
        }`}
        style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={t("vagtplan.title")}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        allow="fullscreen"
      />
    </div>
  );
};

export default VagtplanViewer;