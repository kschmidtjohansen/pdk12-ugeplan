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
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <RefreshCw 
        className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''} ${onRefresh ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
        onClick={onRefresh}
      />
      <span>Opdateret {relativeTime}</span>
      {isRefreshing && (
        <Badge variant="secondary" className="h-5 text-xs">
          Opdaterer...
        </Badge>
      )}
    </div>
  );
};
