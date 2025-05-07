
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch and handle rendering errors
 * Particularly useful for Supabase connection issues
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use that
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Alert className="max-w-lg mx-auto my-8 border-destructive">
          <AlertTitle className="text-destructive">
            Noget gik galt
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              Der opstod en fejl under indlæsning af siden. Dette kan skyldes problemer med forbindelsen til databasen.
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Teknisk fejl: {this.state.error?.message || 'Ukendt fejl'}
            </p>
            <Button onClick={this.handleRetry} className="flex items-center gap-2">
              <RefreshCw size={16} />
              <span>Prøv igen</span>
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
