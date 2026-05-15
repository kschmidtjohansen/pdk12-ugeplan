import React, { useEffect } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';

interface ScreenDisplayErrorBoundaryProps {
  children: React.ReactNode;
  date: string;
  onRetry: () => void;
}

/**
 * Neutral kiosk-friendly fallback for TV/skærm-visning.
 * - Ingen gradient eller farvet baggrund (kun bg-background).
 * - Polygon-logo + "Skærmen er ikke tilgængelig".
 * - Auto-reload hvert 60. sekund via window.location.reload().
 */
const ScreenDisplayFallback: React.FC = () => {
  useEffect(() => {
    const timer = setInterval(() => {
      window.location.reload();
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-6 max-w-md">
        <img
          src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
          alt="Polygon"
          className="h-12 w-auto"
        />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            Skærmen er ikke tilgængelig
          </h1>
          <p className="text-sm text-muted-foreground">
            Visningen genindlæses automatisk hvert minut.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Genindlæs nu
        </button>
      </div>
    </div>
  );
};

export const ScreenDisplayErrorBoundary: React.FC<ScreenDisplayErrorBoundaryProps> = ({
  children,
  date,
}) => {
  return (
    <DataFetchErrorBoundary
      fallback={<ScreenDisplayFallback />}
      onError={(error, errorInfo) => {
        if (import.meta.env.DEV) console.error('[ScreenDisplayErrorBoundary] Caught error:', {
          error,
          errorInfo,
          date,
          timestamp: new Date().toISOString()
        });
      }}
    >
      {children}
    </DataFetchErrorBoundary>
  );
};
