
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logSecurityEvent } from '@/utils/securityLogger';
import { Sentry } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error);
    this.setState({ errorInfo });
    
    // Log security-related errors
    if (this.isSecurityRelatedError(error)) {
      logSecurityEvent(
        'security_error',
        `Security boundary caught error: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        },
        'error'
      );
    }
    
    if (import.meta.env.DEV) console.error('[SecurityErrorBoundary] Error caught:', error, errorInfo);
  }

  private isSecurityRelatedError(error: Error): boolean {
    const securityKeywords = [
      'authentication',
      'authorization', 
      'permission',
      'row-level security',
      'rls',
      'policy',
      'access denied',
      'unauthorized',
      'forbidden'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isSecurityError = this.state.error && this.isSecurityRelatedError(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant={isSecurityError ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {isSecurityError ? 'Security Error Detected' : 'Something went wrong'}
                  </p>
                  <p className="text-sm">
                    {isSecurityError 
                      ? 'A security-related error occurred. This has been logged for review.'
                      : 'An unexpected error occurred. Please try refreshing the page.'
                    }
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="text-xs bg-muted p-2 rounded mt-2">
                      <summary className="cursor-pointer">Error Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.error.message}
                        {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
