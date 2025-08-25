import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { FileSpreadsheet, RefreshCw, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VagtplanViewer from '@/components/Vagtplan/VagtplanViewer';

const VagtplanPage: React.FC = () => {
  const { t } = useTranslation();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFullscreen = () => {
    // Open the OneDrive file in a new tab for fullscreen viewing
    const oneDriveUrl = process.env.REACT_APP_ONEDRIVE_EMBED_URL || '#';
    window.open(oneDriveUrl, '_blank');
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("vagtplan.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("vagtplan.description")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("vagtplan.refresh")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              <Maximize className="h-4 w-4 mr-2" />
              {t("vagtplan.fullscreen")}
            </Button>
          </div>
        </div>

        {/* Vagtplan Viewer */}
        <div className="bg-card rounded-lg border shadow-sm">
          <VagtplanViewer />
        </div>
      </div>
    </div>
  );
};

export default VagtplanPage;