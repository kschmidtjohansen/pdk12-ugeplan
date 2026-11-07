import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, LayoutDashboard, CalendarDays, Users, Car, Palmtree, Phone, Package, Settings, Building2, FileText, CornerDownLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { openAssignmentDetails } from '@/stores/assignmentDetailsStore';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

interface SearchRow { id: string; title: string; location: string | null; case_number: string | null; assignment_date: string }

/** Cult UI-inspired spotlight. Opens with Cmd/Ctrl+K or the "open-command-palette" window event. */
const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const { userDepartments, selectedDepartmentId, switchDepartment, isDutyEnabled, isWarehouseEnabled } = useDepartment();
  const { isEffectiveAdmin, canViewDuty, canViewWarehouse } = useAuth() as ReturnType<typeof useAuth> & { canViewDuty?: boolean; canViewWarehouse?: boolean };
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const reqRef = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(o => !o); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('open-command-palette', onOpen); };
  }, []);

  useEffect(() => { if (!open) { setQuery(''); setRows([]); setActive(0); } }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2 || !selectedDepartmentId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const id = ++reqRef.current;
    const h = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_assignments' as never, { query: q, dept_id: selectedDepartmentId } as never);
      if (id !== reqRef.current) return;
      setRows(error ? [] : ((data as unknown as SearchRow[]) || []).slice(0, 8));
      setLoading(false);
    }, 250);
    return () => clearTimeout(h);
  }, [query, open, selectedDepartmentId]);

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => { setOpen(false); navigate(path); };
    const pagesGroup = da ? 'Sider' : 'Pages';
    const pages: Item[] = [
      { id: 'p-dash', group: pagesGroup, label: t('navigation.dashboard'), icon: LayoutDashboard, run: go('/dashboard') },
      { id: 'p-plan', group: pagesGroup, label: t('navigation.planner'), icon: CalendarDays, run: go('/planner') },
      { id: 'p-emp', group: pagesGroup, label: t('navigation.employees'), icon: Users, run: go('/employees') },
      { id: 'p-car', group: pagesGroup, label: t('navigation.cars'), icon: Car, run: go('/cars') },
      { id: 'p-vac', group: pagesGroup, label: t('navigation.vacation'), icon: Palmtree, run: go('/vacation') },
    ];
    if (isDutyEnabled && canViewDuty !== false) pages.push({ id: 'p-duty', group: pagesGroup, label: t('navigation.duty'), icon: Phone, run: go('/duty') });
    if (isWarehouseEnabled && canViewWarehouse !== false) pages.push({ id: 'p-wh', group: pagesGroup, label: t('navigation.warehouse'), icon: Package, run: go('/warehouse') });
    if (isEffectiveAdmin) pages.push({ id: 'p-admin', group: pagesGroup, label: t('navigation.admin'), icon: Settings, run: go('/admin') });

    const deptGroup = da ? 'Skift afdeling' : 'Switch department';
    const depts: Item[] = (userDepartments ?? [])
      .filter(d => d.id !== selectedDepartmentId)
      .map(d => ({ id: `d-${d.id}`, group: deptGroup, label: d.name, icon: Building2, run: () => { setOpen(false); switchDepartment(d.id); } }));

    const taskGroup = da ? 'Opgaver' : 'Tasks';
    const tasks: Item[] = rows.map(r => {
      let date = '';
      try { date = format(parseISO(r.assignment_date), 'dd-MM-yyyy'); } catch { /* ugyldig dato */ }
      return {
        id: `a-${r.id}`, group: taskGroup, label: r.title, icon: FileText,
        hint: [r.case_number, r.location, date].filter(Boolean).join(' · '),
        run: () => { setOpen(false); openAssignmentDetails(r.id); },
      };
    });

    const q = query.trim().toLowerCase();
    const match = (i: Item) => !q || i.label.toLowerCase().includes(q);
    return [...tasks, ...pages.filter(match), ...depts.filter(match)];
  }, [rows, query, da, t, navigate, isDutyEnabled, isWarehouseEnabled, isEffectiveAdmin, canViewDuty, canViewWarehouse, userDepartments, selectedDepartmentId, switchDepartment]);

  useEffect(() => { setActive(a => Math.min(a, Math.max(items.length - 1, 0))); }, [items.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && items[active]) { e.preventDefault(); items[active].run(); }
  };

  let lastGroup = '';
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[15%] translate-y-0 max-w-xl gap-0 overflow-hidden p-0 motion-safe:animate-scale-in">
        <DialogTitle className="sr-only">{da ? 'Hurtigsøgning' : 'Quick search'}</DialogTitle>
        <DialogDescription className="sr-only">{da ? 'Søg efter sager, sider og afdelinger' : 'Search cases, pages and departments'}</DialogDescription>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder={da ? 'Søg sagsnummer, adresse, side eller afdeling…' : 'Search case number, address, page or department…'}
            aria-label={da ? 'Hurtigsøgning' : 'Quick search'}
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
        </div>
        <ul id="command-palette-list" role="listbox" className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <li className="px-3 py-8 text-center text-xs text-muted-foreground">{loading ? '…' : da ? 'Ingen resultater' : 'No results'}</li>
          )}
          {items.map((it, idx) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            const Icon = it.icon;
            return (
              <React.Fragment key={it.id}>
                {header && <li role="presentation" className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{header}</li>}
                <li role="option" aria-selected={idx === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={it.run}
                    className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors', idx === active ? 'bg-accent text-foreground' : 'text-foreground/90')}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{it.label}</span>
                      {it.hint && <span className="block truncate text-[11px] text-muted-foreground">{it.hint}</span>}
                    </span>
                    {idx === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
        <div className="hidden items-center gap-3 border-t border-border px-3 py-2 text-[11px] text-muted-foreground sm:flex">
          <span><kbd className="rounded border border-border px-1">↑↓</kbd> {da ? 'vælg' : 'select'}</span>
          <span><kbd className="rounded border border-border px-1">↵</kbd> {da ? 'åbn' : 'open'}</span>
          <span className="ml-auto"><kbd className="rounded border border-border px-1">⌘K</kbd></span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
