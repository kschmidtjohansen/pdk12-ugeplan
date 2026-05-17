import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Sentry } from '@/lib/sentry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const getBrowserLanguage = () => {
  const lang = navigator.language || (navigator as any).userLanguage || '';
  return lang.startsWith('da') ? 'da' : 'en';
};

const texts = {
  da: {
    title: 'Noget gik galt',
    description: 'Der opstod en uventet fejl. Prøv at genindlæse siden eller kontakt support, hvis problemet fortsætter.',
    retry: 'Prøv igen',
    reload: 'Genindlæs side',
    details: 'Fejldetaljer',
  },
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Try reloading the page or contact support if the problem persists.',
    retry: 'Try again',
    reload: 'Reload page',
    details: 'Error details',
  },
};

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error);
    if (import.meta.env.DEV) console.error('[GlobalErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const lang = getBrowserLanguage();
      const t = texts[lang];

      return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-2 border-destructive/20 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">{t.description}</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  {t.retry}
                </Button>
                <Button onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t.reload}
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left text-xs text-muted-foreground mt-4">
                  <summary className="cursor-pointer font-medium">{t.details}</summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
