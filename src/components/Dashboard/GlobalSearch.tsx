import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Car as CarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAssignments } from '@/hooks/useAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { Assignment } from '@/types/assignment';

const AssignmentDetailsDialog = lazy(() => import('./AssignmentDetailsDialog'));

type Result =
  | { kind: 'case'; id: string; title: string; sub: string; a: Assignment }
  | { kind: 'person'; id: string; title: string; sub: string }
  | { kind: 'car'; id: string; title: string; sub: string };

const GlobalSearch: React.FC = () => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { assignments } = useAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    const cases = (assignments ?? [])
      .filter(a => [a.case_number, a.title, a.location, a.city, a.zip_code].some(v => v?.toLowerCase().includes(s)))
      .sort((a, b) => Math.abs(Date.parse(a.date) - Date.parse(today)) - Math.abs(Date.parse(b.date) - Date.parse(today)))
      .slice(0, 6)
      .map<Result>(a => ({
        kind: 'case', id: a.id, a,
        title: `${a.case_number ? `#${a.case_number} ` : ''}${a.title}`,
        sub: `${format(parseISO(a.date), 'dd.MM')} ${a.fromTime?.slice(0, 5) ?? ''} · ${a.location ?? ''}`,
      }));
    const people = (employees ?? [])
      .filter(e => e.name?.toLowerCase().includes(s))
      .slice(0, 4)
      .map<Result>(e => ({ kind: 'person', id: e.id, title: e.name, sub: e.jobTitle || e.role }));
    const carRes = (cars ?? [])
      .filter(c => [c.name, c.number_plate, c.car_number].some(v => v?.toLowerCase().includes(s)))
      .slice(0, 4)
      .map<Result>(c => ({ kind: 'car', id: c.id, title: c.name, sub: c.number_plate }));
    return [...cases, ...people, ...carRes];
  }, [q, assignments, employees, cars]);

  const pick = (r: Result) => {
    setOpen(false);
    setQ('');
    if (r.kind === 'case') setSelected(r.a);
    else if (r.kind === 'person') navigate('/employees');
    else navigate('/cars');
  };

  const Icon = { case: FileText, person: User, car: CarIcon };

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter' && results[active]) pick(results[active]);
          else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
        }}
        placeholder="Søg sag, adresse, kollega eller bil"
        aria-label="Søg"
        className="h-11 sm:h-10 w-full rounded-lg border border-border/60 bg-background/70 pl-9 pr-10 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border/60 px-1.5 text-[10px] text-muted-foreground sm:block">/</kbd>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border/60 bg-popover p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Ingen resultater</p>
          ) : results.map((r, i) => {
            const I = Icon[r.kind];
            return (
              <button
                key={`${r.kind}-${r.id}`}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left ${i === active ? 'bg-accent' : ''}`}
              >
                <I className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <Suspense fallback={null}>
          <AssignmentDetailsDialog assignment={selected} cars={cars} isOpen onClose={() => setSelected(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default GlobalSearch;
