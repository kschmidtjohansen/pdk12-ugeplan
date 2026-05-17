import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { useTranslation } from '@/context/TranslationContext';
import { openAssignmentDetails } from '@/stores/assignmentDetailsStore';
import { format, parseISO } from 'date-fns';

interface SearchRow {
  id: string;
  title: string;
  location: string | null;
  case_number: string | null;
  assignment_date: string;
}

const GlobalAssignmentSearch: React.FC = () => {
  const { selectedDepartmentId } = useDepartment();
  const { t, currentLanguage } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const reqRef = useRef(0);

  const placeholder = currentLanguage === 'da' ? 'Søg i alle opgaver…' : 'Search all assignments…';
  const noResults = currentLanguage === 'da' ? 'Ingen resultater' : 'No results';

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !selectedDepartmentId) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const reqId = ++reqRef.current;
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_assignments' as any, {
        query: trimmed,
        dept_id: selectedDepartmentId,
      });
      if (reqId !== reqRef.current) return;
      if (error) {
        if (import.meta.env.DEV) console.error('[GlobalAssignmentSearch]', error.message);
        setResults([]);
      } else {
        setResults((data as SearchRow[]) || []);
      }
      setLoading(false);
      setActiveIdx(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selectedDepartmentId]);

  const handleSelect = (id: string) => {
    openAssignmentDetails(id);
    setQuery('');
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[activeIdx].id); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <Popover open={showDropdown} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
            className="h-8 pl-8 pr-7 text-[12px] bg-background/80"
          />
          {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[22rem] p-1 max-h-80 overflow-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {results.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            {loading ? '…' : noResults}
          </div>
        ) : (
          <ul className="text-xs">
            {results.map((r, idx) => {
              let dateStr = '';
              try { dateStr = format(parseISO(r.assignment_date), 'dd-MM-yyyy'); } catch {}
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => handleSelect(r.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-start gap-2 ${idx === activeIdx ? 'bg-accent' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {[r.case_number, r.location].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground shrink-0 pt-0.5">{dateStr}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default GlobalAssignmentSearch;
