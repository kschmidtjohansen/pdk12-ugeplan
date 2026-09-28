import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEmployeeColor } from './employeeColors';

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
}

const toMin = (t?: string) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

const PlannerCalendarView: React.FC<Props> = ({ dates, assignments, employees, vacations, onViewDetails, onCreateAssignment, canEdit }) => {
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
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
      {/* Filterkolonne — sammenklappelig på mobil */}
      <aside className={cn('shrink-0 rounded-xl border border-border bg-card p-3 transition-all duration-200', minimized ? 'lg:w-11' : 'lg:w-56')}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) setMinimized(m => !m);
              else setFiltersOpen(o => !o);
            }}
            title={minimized ? 'Vis medarbejdere' : 'Minimer medarbejderliste'}
            className="flex items-center gap-2 min-h-[36px] text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            <span className={cn(minimized && 'lg:hidden')}>Medarbejdere ({lanes.length})</span>
            <ChevronDown className={cn('h-3.5 w-3.5 lg:hidden transition-transform', filtersOpen && 'rotate-180')} />
            <ChevronDown className={cn('hidden lg:block h-3.5 w-3.5 transition-transform', minimized ? 'rotate-180' : 'rotate-90')} />
          </button>
          <div className={cn('flex gap-1', minimized && 'lg:hidden')}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setSelected(new Set(sorted.map(e => e.id)))}>Alle</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setSelected(new Set(sorted.filter(e => e.role === 'fugttekniker' || e.roles?.includes('fugttekniker')).map(e => e.id)))}>Fugt</Button>
          </div>
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
                {format(dt, 'EEE d. MMM', { locale: da })}
              </Button>
            );
          })}
        </div>

        {lanes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Vælg medarbejdere i listen for at se deres kalender.</div>
        ) : (
          <div className="overflow-auto max-h-[75vh]">
            <div className="min-w-max">
              {/* Header + heldagsrække */}
              <div className="flex sticky top-0 z-20 bg-card border-b border-border">
                <div className="w-14 shrink-0 sticky left-0 bg-card z-30" />
                {lanes.map(e => {
                  const abs = absentOn(e.id);
                  const c = getEmployeeColor(e.id, sorted.findIndex(s => s.id === e.id));
                  return (
                    <div key={e.id} className="w-36 sm:w-44 shrink-0 border-l border-border px-2 py-1.5" style={{ borderTop: `3px solid ${c.border}` }}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.border }} />
                        <span className="text-xs font-semibold truncate">{e.name}</span>
                      </div>
                      <div className="h-5 mt-1">
                        {abs && <span className="inline-block max-w-full truncate rounded bg-destructive/15 text-destructive text-[10px] font-medium px-1.5 py-0.5">{abs.request_type === 'partial_day' ? `Fravær ${abs.start_time?.slice(0,5) ?? ''}–${abs.end_time?.slice(0,5) ?? ''}` : 'Fravær / ferie'}</span>}
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
                    <div key={e.id} className={cn('w-36 sm:w-44 shrink-0 border-l border-border relative', absentOn(e.id) && 'bg-muted/40')}>
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
                              <button type="button" onClick={() => onViewDetails(a)}
                                className={cn('absolute left-1 right-1 z-[5] rounded-md border-l-4 px-1.5 py-1 text-left overflow-hidden shadow-sm hover:shadow-md transition-shadow', !a.published && 'border-dashed opacity-80')}
                                style={{ top, height, backgroundColor: c.background, borderColor: c.border, color: c.text }}>
                                <div className="text-[10px] font-medium opacity-80">{timeLabel}</div>
                                <div className="text-xs font-semibold leading-tight line-clamp-2">{a.title}</div>
                                {height > 60 && <div className="text-[10px] opacity-80 truncate">{a.location}</div>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-64 p-2.5">
                              <div className="text-xs font-semibold leading-tight">{a.title}</div>
                              {a.case_number && <div className="mt-1 text-[11px] opacity-90">Sagsnummer: {a.case_number}</div>}
                              <div className="text-[11px] opacity-90">Tidspunkt: {timeLabel}</div>
                              {a.location && <div className="text-[11px] opacity-90">Adresse: {a.location}</div>}
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
    </div>
    </TooltipProvider>
  );
};

export default PlannerCalendarView;
