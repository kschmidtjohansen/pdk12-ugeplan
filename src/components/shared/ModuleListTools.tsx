import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import type { FilterSegment } from './SegmentedFilterBar';

/**
 * Shared, compact filter row for list pages:
 * status segments with counts · search · optional extra filters · result count · clear.
 * One row on desktop; wraps on small screens with 44px touch targets.
 */
export default function ModuleListTools({ segments, active, onSelect, search, onSearch, placeholder, count, total, onReset, trailing, note, filtered: filteredOverride }: {
  segments: FilterSegment[]; active: string; onSelect: (key: string) => void;
  search: string; onSearch: (value: string) => void; placeholder: string; count: number; total: number; onReset: () => void;
  /** Extra filter controls (e.g. a select) shown after the search field. */
  trailing?: React.ReactNode;
  /** Small secondary info shown under the row. */
  note?: React.ReactNode;
  /** Override when extra filters (trailing) are active. */
  filtered?: boolean;
}) {
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const filtered = filteredOverride ?? (active !== 'all' || search.trim().length > 0);
  return <section aria-label={da ? 'Filtre og resultater' : 'Filters and results'} className="mb-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted/60 p-1 scrollbar-none" role="group" aria-label="Status">
        {segments.map(segment => {
          const isActive = active === segment.key;
          return <button key={segment.key} type="button" aria-label={`${segment.label}${segment.count === undefined ? '' : ` ${segment.count}`}`} aria-pressed={isActive} onClick={() => onSelect(segment.key)}
            className={cn('inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8',
              isActive ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
            <span>{segment.label}</span>
            {segment.count !== undefined && <span className={cn('tabular-nums', isActive ? 'text-foreground' : 'text-muted-foreground', segment.highlight && 'text-warning-soft-foreground')}>{segment.count}</span>}
          </button>;
        })}
      </div>
      <div className="relative w-full sm:w-64">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" aria-label={placeholder} placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} className="h-11 min-h-11 pl-9 sm:h-9 sm:min-h-9" />
      </div>
      {trailing && <div className="flex flex-wrap items-center gap-2">{trailing}</div>}
      <div className="flex items-center gap-2 sm:ml-auto">
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground tabular-nums">{da ? `Viser ${count} af ${total}` : `Showing ${count} of ${total}`}</p>
        {filtered && <Button variant="ghost" size="sm" onClick={onReset} className="min-h-11 gap-1.5 text-xs sm:min-h-8"><X aria-hidden className="h-3.5 w-3.5" />{da ? 'Ryd filtre' : 'Clear filters'}</Button>}
      </div>
    </div>
    {note && <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">{note}</div>}
  </section>;
}
