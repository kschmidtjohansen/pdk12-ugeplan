import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional label shown in the fallback to identify which widget failed. */
  label?: string;
  /** Optional custom fallback override. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const getLang = (): 'da' | 'en' => {
  const lang = navigator.language || '';
  return lang.startsWith('da') ? 'da' : 'en';
};

const texts = {
  da: {
    title: 'Noget gik galt i denne sektion',
    description: 'Resten af ugeplanen virker stadig. Prøv at genindlæse denne del.',
    retry: 'Prøv igen',
    details: 'Fejldetaljer',
  },
  en: {
    title: 'Something went wrong in this section',
    description: 'The rest of the planner still works. Try reloading this part.',
    retry: 'Try again',
    details: 'Error details',
  },
};

/**
 * Localized error boundary used to isolate runtime failures in individual
 * Planner widgets/days so a single broken section does not crash the page.
 */
export class PlannerWidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(
        `[PlannerWidgetErrorBoundary]${this.props.label ? ` (${this.props.label})` : ''} caught:`,
        error,
        errorInfo
      );
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const t = texts[getLang()];
      return (
        <div className="w-full rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-semibold text-destructive">
                {t.title}
                {this.props.label ? ` — ${this.props.label}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">{t.details}</summary>
                  <pre className="mt-1 p-2 bg-muted rounded overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button onClick={this.handleRetry} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                {t.retry}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PlannerWidgetErrorBoundary;
