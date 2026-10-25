import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import type { FilterSegment } from './SegmentedFilterBar';

export function ModuleContext({ department, role }: { department?: string; role?: string }) {
  return <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border pb-3 text-xs text-muted-foreground">
    {department && <span className="font-semibold text-foreground">{department}</span>}
    {role && <span>{role}</span>}
  </div>;
}

export default function ModuleListTools({ segments, active, onSelect, search, onSearch, placeholder, count, total, onReset }: {
  segments: FilterSegment[]; active: string; onSelect: (key: string) => void;
  search: string; onSearch: (value: string) => void; placeholder: string; count: number; total: number; onReset: () => void;
}) {
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const filtered = active !== 'all' || search.trim().length > 0;
  return <section aria-label={da ? 'Filtre og resultater' : 'Filters and results'} className="mb-4 border-y border-border bg-card">
    <div className="grid grid-cols-2 divide-x divide-y divide-border sm:flex sm:flex-wrap sm:divide-y-0" role="group" aria-label={da ? 'Status' : 'Status'}>
      {segments.map(segment => <Button key={segment.key} variant="ghost" aria-pressed={active === segment.key} onClick={() => onSelect(segment.key)}
        className={cn('h-auto min-h-14 min-w-0 flex-1 justify-between gap-3 rounded-none border-b-2 border-transparent px-3 py-3 text-left whitespace-normal', active === segment.key && 'border-b-primary bg-accent text-foreground')}>
        <span className="text-xs font-medium">{segment.label}</span><span className={cn('text-lg font-semibold tabular-nums', segment.highlight && 'text-warning-soft-foreground')}>{segment.count ?? '–'}</span>
      </Button>)}
    </div>
    <div className="flex flex-wrap items-center gap-3 border-t border-border p-3">
      <div className="relative w-full sm:max-w-sm"><Search aria-hidden className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" aria-label={placeholder} placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} className="h-11 pl-9" />
      </div>
      <p role="status" aria-live="polite" className="flex-1 text-xs text-muted-foreground tabular-nums">{da ? `Viser ${count} af ${total}` : `Showing ${count} of ${total}`}</p>
      <Button variant="ghost" disabled={!filtered} onClick={onReset} className="min-h-11 gap-2"><X aria-hidden className="h-4 w-4" />{da ? 'Ryd filtre' : 'Clear filters'}</Button>
    </div>
  </section>;
}