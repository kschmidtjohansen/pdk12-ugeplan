import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import type { Locale } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEmployeeColor } from './employeeColors';
import { useTranslation } from '@/context/TranslationContext';

const START_HOUR = 6;
const END_HOUR = 19;
const HOUR_PX = 56;

interface Props {
  dates: string[];
  assignments: Assignment[];
  employees: Employee[];
  vacations: Vacation[];
  onViewDetails: (a: Assignment) => void;
  onCreateAssignment?: (date: string) => void;
  canEdit: boolean;
  onEditAssignment?: (a: Assignment) => void;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
}

const toMin = (t?: string) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

const dateLabel = (d: string | undefined, dateLocale: Locale) => {
  if (!d) return '';
  try { return format(parseISO(d), 'EEE d. MMM yyyy', { locale: dateLocale }); } catch { return d; }
};

const PlannerCalendarView: React.FC<Props> = ({ dates, assignments, employees, vacations, onViewDetails, onCreateAssignment, canEdit, onEditAssignment, onPreviousWeek, onNextWeek }) => {
  const { t: tr } = useTranslation();
  const dateLocale = useDateLocale();
  const swipeRef = React.useRef<{ x: number; y: number; scroller: Element | null; scrollLeft: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    // Remember the nearest horizontally scrollable ancestor so we can tell a
    // week-swipe apart from a pan-scroll inside the day strip or grid.
    const scroller = (e.target as HTMLElement).closest?.('.overflow-x-auto, .overflow-auto') ?? null;
    swipeRef.current = { x: t.clientX, y: t.clientY, scroller, scrollLeft: scroller?.scrollLeft ?? 0 };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const st = swipeRef.current; swipeRef.current = null; if (!st) return;
    const t = e.changedTouches[0]; const dx = t.clientX - st.x; const dy = t.clientY - st.y;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // If the gesture scrolled a scrollable child, it was a pan — not a week swipe.
    if (st.scroller && Math.abs(st.scroller.scrollLeft - st.scrollLeft) > 4) return;
    if (dx < 0) onNextWeek?.(); else onPreviousWeek?.();
  };
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [day, setDay] = useState<string>(() => (dates.includes(todayStr) ? todayStr : dates[0]));
  useEffect(() => { if (!dates.includes(day)) setDay(dates.includes(todayStr) ? todayStr : dates[0]); }, [dates, day, todayStr]);

  const sorted = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name, 'da')), [employees]);
  const [selected, setSelected] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('plannerCalendarEmployees') || '[]');
      if (Array.isArray(saved) && saved.length) return new Set(saved);
    } catch { /* ignore */ }
    return new Set();
  });
  // Default: fugtteknikere, ellers alle med opgaver i ugen
  useEffect(() => {
    if (selected.size || !employees.length) return;
    const fugt = employees.filter(e => e.role === 'fugttekniker' || e.roles?.includes('fugttekniker')).map(e => e.id);
    const busy = new Set(assignments.flatMap(a => a.assignedEmployees?.map(x => x.id) || []));
    setSelected(new Set(fugt.length ? fugt : employees.filter(e => busy.has(e.id)).map(e => e.id)));
  }, [employees, assignments, selected.size]);
  useEffect(() => { localStorage.setItem('plannerCalendarEmployees', JSON.stringify([...selected])); }, [selected]);

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const lanes = sorted.filter(e => selected.has(e.id));
  const dayAssignments = assignments.filter(a => a.date === day);

  const absentOn = (empId: string) => vacations.find(v => v.status === 'approved' && v.user_id === empId && v.start_date <= day && v.end_date >= day);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tapped, setTapped] = useState<Assignment | null>(null);
  const isTouch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches, []);
  const [minimized, setMinimized] = useState<boolean>(() => {
    try { return localStorage.getItem('plannerCalendarSidebarMinimized') === '1'; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem('plannerCalendarSidebarMinimized', minimized ? '1' : '0'); } catch { /* ignore */ } }, [minimized]);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = day === todayStr && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_PX;

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Filterkolonne — sammenklappelig på mobil */}
      <aside className={cn('shrink-0 rounded-xl border border-border bg-card p-3 transition-all duration-200', minimized ? 'lg:w-11' : 'lg:w-60')}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) setMinimized(m => !m);
              else setFiltersOpen(o => !o);
            }}
            title={minimized ? tr('ui.showEmployees') : tr('ui.minimizeEmployeeList')}
            className="flex min-w-0 flex-1 items-center gap-2 min-h-[36px] text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className={cn('truncate', minimized && 'lg:hidden')}>{tr('ui.employees')} ({lanes.length})</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 lg:hidden transition-transform', filtersOpen && 'rotate-180')} />
            <ChevronDown className={cn('hidden lg:block h-3.5 w-3.5 shrink-0 transition-transform', minimized ? 'rotate-180' : 'rotate-90')} />
          </button>
        </div>
        <div className={cn('mt-2 grid grid-cols-2 gap-1', minimized && 'lg:hidden', !filtersOpen && 'hidden lg:grid')}>
          <Button variant="outline" size="sm" className="h-8 w-full px-2 text-xs" onClick={() => setSelected(new Set(sorted.map(e => e.id)))}>{tr('common.all')}</Button>
          <Button variant="outline" size="sm" className="h-8 w-full px-2 text-xs" onClick={() => setSelected(new Set(sorted.filter(e => e.role === 'fugttekniker' || e.roles?.includes('fugttekniker')).map(e => e.id)))}>{tr('ui.moisture')}</Button>
        </div>
        <div className={cn('mt-2 max-h-56 lg:max-h-[640px] overflow-y-auto space-y-0.5', !filtersOpen && 'hidden', !minimized && 'lg:block')}>
          {sorted.map((e, i) => {
            const c = getEmployeeColor(e.id, i);
            return (
              <label key={e.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted cursor-pointer min-h-[40px] lg:min-h-[32px]">
                <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} />
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.border }} />
                <span className="truncate">{e.name}</span>
              </label>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0 rounded-xl border border-border bg-card overflow-hidden">
        {/* Dagsvælger */}
        <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
          {dates.map(d => {
            const dt = parseISO(d);
            return (
              <Button key={d} size="sm" variant={d === day ? 'default' : 'ghost'} onClick={() => setDay(d)}
                className={cn('h-9 px-3 text-xs capitalize shrink-0', isSameDay(dt, new Date()) && d !== day && 'text-primary font-semibold')}>
                {format(dt, 'EEE d. MMM', { locale: dateLocale })}
              </Button>
            );
          })}
        </div>

        {lanes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{tr('ui.selectEmployeesForCalendar')}</div>
        ) : (
          <div className="overflow-auto max-h-[75vh]">
            <div className="min-w-full w-max">
              {/* Header + heldagsrække */}
              <div className="flex sticky top-0 z-20 bg-card border-b border-border">
                <div className="w-14 shrink-0 sticky left-0 bg-card z-30" />
                {lanes.map(e => {
                  const abs = absentOn(e.id);
                  const c = getEmployeeColor(e.id, sorted.findIndex(s => s.id === e.id));
                  return (
                    <div key={e.id} className="flex-1 min-w-[130px] sm:min-w-[150px] border-l border-border px-2 py-1.5" style={{ borderTop: `3px solid ${c.border}` }}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.border }} />
                        <span className="text-xs font-semibold truncate">{e.name}</span>
                      </div>
                      <div className="h-5 mt-1">
                        {abs && <span className="inline-block max-w-full truncate rounded bg-destructive/15 text-destructive text-[10px] font-medium px-1.5 py-0.5">{abs.request_type === 'partial_day' ? `${tr('ui.absence')} ${abs.start_time?.slice(0,5) ?? ''}–${abs.end_time?.slice(0,5) ?? ''}` : tr('ui.absenceOrVacation')}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex relative" style={{ height: gridHeight }}>
                {/* Tidsakse */}
                <div className="w-14 shrink-0 sticky left-0 bg-card z-10 relative">
                  {hours.map(h => (
                    <div key={h} className="absolute right-1.5 text-[10px] text-muted-foreground -translate-y-1/2" style={{ top: (h - START_HOUR) * HOUR_PX }}>
                      {h > START_HOUR && `${String(h).padStart(2, '0')}:00`}
                    </div>
                  ))}
                </div>
                {lanes.map((e, li) => {
                  const items = dayAssignments.filter(a => a.assignedEmployees?.some(x => x.id === e.id) || a.employees?.includes(e.id));
                  const c = getEmployeeColor(e.id, sorted.findIndex(s => s.id === e.id));
                  return (
                    <div key={e.id} className={cn('flex-1 min-w-[130px] sm:min-w-[150px] border-l border-border relative', absentOn(e.id) && 'bg-muted/40')}>
                      {hours.map(h => (
                        <button key={h} type="button" disabled={!canEdit || !onCreateAssignment}
                          onClick={() => onCreateAssignment?.(day)}
                          className="absolute inset-x-0 border-t border-border/60 hover:bg-primary/5 disabled:hover:bg-transparent"
                          style={{ top: (h - START_HOUR) * HOUR_PX, height: HOUR_PX }}
                          aria-label={`Opret opgave ${String(h).padStart(2, '0')}:00`} />
                      ))}
                      {items.map(a => {
                        const s = toMin(a.fromTime) ?? 8 * 60;
                        const en = Math.max(toMin(a.toTime) ?? s + 60, s + 20);
                        const top = Math.max(0, ((s - START_HOUR * 60) / 60) * HOUR_PX);
                        const height = Math.max(22, ((Math.min(en, END_HOUR * 60) - Math.max(s, START_HOUR * 60)) / 60) * HOUR_PX - 2);
                        const timeLabel = `${a.fromTime?.slice(0, 5) ?? ''}–${a.toTime?.slice(0, 5) ?? ''}`;
                        return (
                          <Tooltip key={a.id} delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={() => (isTouch ? setTapped(a) : onViewDetails(a))}
                                className={cn('absolute left-1 right-1 z-[5] rounded-md border-l-4 px-1.5 py-1 text-left overflow-hidden shadow-sm hover:shadow-md transition-shadow', !a.published && 'border-dashed opacity-80')}
                                style={{ top, height, backgroundColor: c.background, borderColor: c.border, color: c.text }}>
                                <div className="text-[10px] font-medium opacity-80">{timeLabel}</div>
                                <div className="text-xs font-semibold leading-tight line-clamp-2">{a.title}</div>
                                {height > 60 && <div className="text-[10px] opacity-80 truncate">{a.location}</div>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-64 p-2.5">
                              <div className="text-xs font-semibold leading-tight">{a.title}</div>
                              {a.case_number && <div className="mt-1 text-[11px] opacity-90">{tr('ui.caseNumberLabel')}: {a.case_number}</div>}
                              <div className="text-[11px] opacity-90">{tr('ui.dateLabel')}: {dateLabel(a.date, dateLocale)}</div>
                              <div className="text-[11px] opacity-90">{tr('ui.timeLabel')}: {timeLabel}</div>
                              {a.location && <div className="text-[11px] opacity-90">{tr('ui.addressLabel')}: {a.location}</div>}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {showNow && li >= 0 && <div className="absolute inset-x-0 z-[6] h-0.5 bg-destructive pointer-events-none" style={{ top: ((nowMin - START_HOUR * 60) / 60) * HOUR_PX }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobil: tryk på opgave viser kort med detaljer */}
      {tapped && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setTapped(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold leading-tight">{tapped.title}</div>
            {tapped.case_number && <div className="mt-1.5 text-xs text-muted-foreground">{tr('ui.caseNumberLabel')}: {tapped.case_number}</div>}
            <div className="text-xs text-muted-foreground">{tr('ui.dateLabel')}: {dateLabel(tapped.date, dateLocale)}</div>
            <div className="text-xs text-muted-foreground">{tr('ui.timeLabel')}: {tapped.fromTime?.slice(0, 5) ?? ''}–{tapped.toTime?.slice(0, 5) ?? ''}</div>
            {tapped.location && <div className="text-xs text-muted-foreground">{tr('ui.addressLabel')}: {tapped.location}</div>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => { setTapped(null); onViewDetails(tapped); }}>{tr('ui.openDetails')}</Button>
              {canEdit && onEditAssignment && (
                <Button size="sm" variant="outline" onClick={() => { setTapped(null); onEditAssignment(tapped); }}>{tr('common.edit')}</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setTapped(null)}>{tr('common.close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};

export default PlannerCalendarView;
