import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

interface LastRefreshIndicatorProps {
  lastRefresh: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const LastRefreshIndicator: React.FC<LastRefreshIndicatorProps> = ({
  lastRefresh,
  isRefreshing = false,
  onRefresh
}) => {
  if (!lastRefresh) return null;

  const relativeTime = formatDistanceToNow(lastRefresh, {
    addSuffix: true,
    locale: da
  });

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={!onRefresh || isRefreshing}
      className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw 
        className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
      />
      <span>Opdateret {relativeTime}</span>
      {isRefreshing && (
        <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
          Opdaterer...
        </Badge>
      )}
    </button>
  );
};
