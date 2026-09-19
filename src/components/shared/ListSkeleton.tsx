import React from 'react';

interface ListSkeletonProps {
  rowCount?: number;
  /** Fixed row height in px. Lets callers reserve the same space the real content takes. */
  rowHeight?: number;
  /** 'list' = table/list rows, 'card' = dashboard cards/panels. */
  variant?: 'list' | 'card';
  className?: string;
}

/**
 * Generic loading placeholder for list/table pages and card surfaces.
 * list: `rowCount` rows with avatar square + two stacked lines + right-side short line.
 * card: `rowCount` card blocks with a title line and a body block.
 */
const ListSkeleton: React.FC<ListSkeletonProps> = ({
  rowCount = 8,
  rowHeight,
  variant = 'list',
  className,
}) => {
  if (variant === 'card') {
    return (
      <div className={`w-full space-y-4 ${className ?? ''}`} aria-busy="true" aria-live="polite">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-4 space-y-3"
            style={rowHeight ? { height: rowHeight } : undefined}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 bg-muted animate-pulse rounded" style={{ width: '35%' }} />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-3 bg-muted animate-pulse rounded" style={{ width: '85%' }} />
            <div className="h-3 bg-muted animate-pulse rounded" style={{ width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full p-3 sm:p-6 space-y-3 ${className ?? ''}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-card"
          style={rowHeight ? { height: rowHeight } : undefined}
        >
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-3.5 bg-muted animate-pulse rounded" style={{ width: '70%' }} />
            <div className="h-3 bg-muted animate-pulse rounded" style={{ width: '40%' }} />
          </div>
          <div className="h-3 w-16 bg-muted animate-pulse rounded shrink-0" />
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
