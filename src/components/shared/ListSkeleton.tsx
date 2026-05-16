import React from 'react';

interface ListSkeletonProps {
  rowCount?: number;
  className?: string;
}

/**
 * Generic loading placeholder for list/table pages.
 * Renders `rowCount` rows with avatar square + two stacked lines + right-side short line.
 */
const ListSkeleton: React.FC<ListSkeletonProps> = ({ rowCount = 8, className }) => {
  return (
    <div className={`w-full p-3 sm:p-6 space-y-3 ${className ?? ''}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-card"
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
