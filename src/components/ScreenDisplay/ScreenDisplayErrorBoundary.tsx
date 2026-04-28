import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenDisplayErrorBoundaryProps {
  children: React.ReactNode;
  date: string;
  onRetry: () => void;
}

export const ScreenDisplayErrorBoundary: React.FC<ScreenDisplayErrorBoundaryProps> = ({
  children,
  date,
  onRetry
}) => {
  return (
    <DataFetchErrorBoundary
      fallback={
        <div className="min-h-screen w-full bg-background flex items-center justify-center">
          <Card className="border-2 border-destructive/20 bg-destructive/5 max-w-lg">
            <CardContent className="p-6 text-center">
              <div className="p-4 rounded-full bg-destructive/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-destructive mb-2">Screen Display Error</h2>
              <p className="text-muted-foreground mb-4">
                There was an error loading the screen display for {date}. 
                This could be due to network issues or data problems.
              </p>
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      }
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