import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

interface ErrorStateProps {
  /** Short headline. Defaults to the shared "could not load data" text. */
  title?: string;
  /** Optional detail line (e.g. the error message). */
  description?: string;
  /** When provided, a retry button is rendered. */
  onRetry?: () => void;
  /** Disables the retry button and shows the retrying label. */
  retrying?: boolean;
  className?: string;
}

/**
 * Shared error state for data-heavy pages.
 * Keeps "no data" (EmptyState) and "load failed" visually distinct.
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  onRetry,
  retrying = false,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center ${className ?? ''}`}
    >
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          {title || t('common.errorLoadingData')}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground break-words max-w-md">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {retrying ? t('common.retrying') : t('common.retry')}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
