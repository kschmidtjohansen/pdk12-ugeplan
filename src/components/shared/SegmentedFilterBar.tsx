import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface FilterSegment {
  key: string;
  label: string;
  count?: number;
  highlight?: boolean;
}

interface SegmentedFilterBarProps {
  segments: FilterSegment[];
  activeKey: string;
  onSegmentChange: (key: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  trailing?: React.ReactNode;
  className?: string;
}

const SegmentedFilterBar: React.FC<SegmentedFilterBarProps> = ({
  segments,
  activeKey,
  onSegmentChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  trailing,
  className,
}) => {
  return (
    <div
      className={cn(
        'sticky top-14 z-20 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 px-4 sm:px-6 lg:px-8 xl:px-12 py-2.5',
        'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'border-b border-border mb-4',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Segments */}
        <div className="inline-flex items-center bg-muted/60 rounded-lg p-1 overflow-x-auto scrollbar-none shrink-0">
          {segments.map((seg) => {
            const isActive = seg.key === activeKey;
            return (
              <button
                key={seg.key}
                onClick={() => onSegmentChange(seg.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                )}
              >
                <span>{seg.label}</span>
                {seg.count !== undefined && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[10px] font-semibold tabular-nums',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : seg.highlight
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-background text-muted-foreground'
                    )}
                  >
                    {seg.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + trailing */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || 'Søg…'}
                className="h-8 pl-8 text-sm"
              />
            </div>
          )}
          {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
        </div>
      </div>
    </div>
  );
};

export default SegmentedFilterBar;
