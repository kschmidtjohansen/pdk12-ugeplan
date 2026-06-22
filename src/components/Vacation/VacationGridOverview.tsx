import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  parseISO,
  eachDayOfInterval,
  getISOWeek,
  isWeekend,
  isSameDay,
  addDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInCalendarDays,
  startOfISOWeek,
} from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types/employee';

const MAX_DAYS = 92;

interface VacationRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
}
interface TrainingRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  title: string | null;
}
interface DutyRow {
  id: string;
  employee_id: string | null;
  duty_date: string;
  duty_type: 'skadeleder_vagt' | 'kørevagt';
  notes?: string | null;
}

type CellKind = 'vacation' | 'training' | 'leave' | 'skadeleder_vagt' | 'kørevagt';

type Group = { key: 'skadeleder' | 'fugttekniker' | 'servicemedarbejder'; label: string; tone: string; rowTone: string; border: string };

const GROUPS: Group[] = [
  { key: 'skadeleder',         label: 'Skadeleder',         tone: 'bg-purple-100 text-purple-800', rowTone: 'bg-purple-50/30', border: 'border-l-purple-500' },
  { key: 'fugttekniker',       label: 'Fugttekniker',       tone: 'bg-blue-100 text-blue-800',     rowTone: 'bg-blue-50/30',   border: 'border-l-blue-500' },
  { key: 'servicemedarbejder', label: 'Servicemedarbejder', tone: 'bg-green-100 text-green-800',   rowTone: 'bg-green-50/30',  border: 'border-l-green-500' },
];

const groupForRole = (role?: string): Group['key'] => {
  switch (role) {
    case 'skadeleder':
    case 'administrator':
    case 'super_admin':
      return 'skadeleder';
    case 'fugttekniker':
      return 'fugttekniker';
    case 'servicemedarbejder':
    case 'vikar':
    default:
      return 'servicemedarbejder';
  }
};

const cellColor: Record<CellKind, string> = {
  vacation: 'bg-foreground',           // sort
  training: 'bg-yellow-400',           // gul
  leave: 'bg-red-500',                 // rød
  skadeleder_vagt: 'bg-blue-500',      // blå
  'kørevagt': 'bg-green-500',          // grøn
};

const cellLabel: Record<CellKind, string> = {
  vacation: 'Ferie',
  training: 'Kursus',
  leave: 'Fravær',
  skadeleder_vagt: 'Skadelederv.',
  'kørevagt': 'Kørevagt',
};

const VacationGridOverview: React.FC = () => {
  const { selectedDepartmentId } = useDepartment();
  const { isDemoMode } = useAuth();
  const { regularEmployees, loading: employeesLoading } = useEmployees();

  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState<Date>(today);
  const [toDate, setToDate] = useState<Date>(addDays(today, 30));
  const [weekAnchor, setWeekAnchor] = useState<Date>(startOfISOWeek(today));
  const [activeKinds, setActiveKinds] = useState<Record<CellKind, boolean>>({
    vacation: true,
    training: true,
    leave: true,
    skadeleder_vagt: true,
    'kørevagt': true,
  });
  const toggleKind = (k: CellKind) =>
    setActiveKinds((prev) => ({ ...prev, [k]: !prev[k] }));


  const totalDays = differenceInCalendarDays(toDate, fromDate) + 1;
  const tooManyDays = totalDays > MAX_DAYS;

  const days = useMemo(() => {
    if (tooManyDays || totalDays <= 0) return [] as Date[];
    return eachDayOfInterval({ start: fromDate, end: toDate });
  }, [fromDate, toDate, tooManyDays, totalDays]);

  const rangeStart = format(fromDate, 'yyyy-MM-dd');
  const rangeEnd = format(toDate, 'yyyy-MM-dd');

  const queryEnabled = !!selectedDepartmentId && !tooManyDays && totalDays > 0;

  const { data: vacations = [] } = useQuery({
    queryKey: ['vacation-grid', selectedDepartmentId, rangeStart, rangeEnd, isDemoMode],
    enabled: queryEnabled,
    queryFn: async (): Promise<VacationRow[]> => {
      let q = supabase
        .from('vacations')
        .select('id, user_id, start_date, end_date, department_id')
        .eq('status', 'approved')
        .eq('is_demo', isDemoMode)
        .lte('start_date', rangeEnd)
        .gte('end_date', rangeStart);
      if (selectedDepartmentId) q = q.eq('department_id', selectedDepartmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as VacationRow[];
    },
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ['training-grid', selectedDepartmentId, rangeStart, rangeEnd, isDemoMode],
    enabled: queryEnabled,
    queryFn: async (): Promise<TrainingRow[]> => {
      let q = supabase
        .from('trainings')
        .select('id, user_id, start_date, end_date, title, department_id')
        .eq('is_demo', isDemoMode)
        .lte('start_date', rangeEnd)
        .gte('end_date', rangeStart);
      if (selectedDepartmentId) q = q.eq('department_id', selectedDepartmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TrainingRow[];
    },
  });

  const { data: duties = [] } = useQuery({
    queryKey: ['duty-grid', selectedDepartmentId, rangeStart, rangeEnd, isDemoMode],
    enabled: queryEnabled,
    queryFn: async (): Promise<DutyRow[]> => {
      let q = supabase
        .from('on_call_duties')
        .select('id, employee_id, duty_date, duty_type, department_id')
        .eq('is_demo', isDemoMode)
        .gte('duty_date', rangeStart)
        .lte('duty_date', rangeEnd);
      if (selectedDepartmentId) q = q.eq('department_id', selectedDepartmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DutyRow[];
    },
  });

  // ===== Ugentlig oversigt (uafhængig af fra/til-range) =====
  const weekStart = weekAnchor;
  const weekEnd = addDays(weekAnchor, 6);
  const weekStartIso = format(weekStart, 'yyyy-MM-dd');
  const weekEndIso = format(weekEnd, 'yyyy-MM-dd');
  const weekQueryEnabled = !!selectedDepartmentId;

  const { data: weekVacations = [] } = useQuery({
    queryKey: ['vacation-week', selectedDepartmentId, weekStartIso, weekEndIso, isDemoMode],
    enabled: weekQueryEnabled,
    queryFn: async (): Promise<VacationRow[]> => {
      let q = supabase
        .from('vacations')
        .select('id, user_id, start_date, end_date, department_id')
        .eq('status', 'approved')
        .eq('is_demo', isDemoMode)
        .lte('start_date', weekEndIso)
        .gte('end_date', weekStartIso);
      if (selectedDepartmentId) q = q.eq('department_id', selectedDepartmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as VacationRow[];
    },
  });

  const { data: weekTrainings = [] } = useQuery({
    queryKey: ['training-week', selectedDepartmentId, weekStartIso, weekEndIso, isDemoMode],
    enabled: weekQueryEnabled,
    queryFn: async (): Promise<TrainingRow[]> => {
      let q = supabase
        .from('trainings')
        .select('id, user_id, start_date, end_date, title, department_id')
        .eq('is_demo', isDemoMode)
        .lte('start_date', weekEndIso)
        .gte('end_date', weekStartIso);
      if (selectedDepartmentId) q = q.eq('department_id', selectedDepartmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TrainingRow[];
    },
  });

  const { data: weekDuties = [] } = useQuery({
    queryKey: ['duty-week', selectedDepartmentId, weekStartIso, weekEndIso, isDemoMode],
    enabled: weekQueryEnabled,
    queryFn: async (): Promise<DutyRow[]> => {
      let q = supabase
        .from('on_call_duties')
        .select('id, employee_id, duty_date, duty_type, department_id, notes')
        .eq('is_demo', isDemoMode)
        .gte('duty_date', weekStartIso)
        .lte('duty_date', weekEndIso);
      if (selectedDepartmentId) q = q.eq('department_id', selectedDepartmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DutyRow[];
    },
  });


  // Maps user_id -> Map<dayKey, CellKind[]>
  const cellsByUser = useMemo(() => {
    const map = new Map<string, Map<string, Set<CellKind>>>();
    const ensure = (uid: string, key: string) => {
      let inner = map.get(uid);
      if (!inner) { inner = new Map(); map.set(uid, inner); }
      let set = inner.get(key);
      if (!set) { set = new Set(); inner.set(key, set); }
      return set;
    };
    const addRange = (uid: string, sIso: string, eIso: string, kind: CellKind) => {
      const s = parseISO(sIso);
      const e = parseISO(eIso);
      const start = s < fromDate ? fromDate : s;
      const end = e > toDate ? toDate : e;
      if (end < start) return;
      for (const d of eachDayOfInterval({ start, end })) {
        ensure(uid, format(d, 'yyyy-MM-dd')).add(kind);
      }
    };
    for (const v of vacations) addRange(v.user_id, v.start_date, v.end_date, 'vacation');
    for (const t of trainings) addRange(t.user_id, t.start_date, t.end_date, 'training');
    for (const d of duties) {
      ensure(d.employee_id, d.duty_date).add(d.duty_type);
    }
    return map;
  }, [vacations, trainings, duties, fromDate, toDate]);

  const onLeaveSet = useMemo(() => {
    const set = new Set<string>();
    for (const e of regularEmployees) {
      if (e.onLeave || e.status === 'on_leave') set.add(e.id);
    }
    return set;
  }, [regularEmployees]);

  const weekGroups = useMemo(() => {
    const groups: { weekNum: number; span: number }[] = [];
    for (const d of days) {
      const w = getISOWeek(d);
      const last = groups[groups.length - 1];
      if (last && last.weekNum === w) last.span += 1;
      else groups.push({ weekNum: w, span: 1 });
    }
    return groups;
  }, [days]);

  const grouped = useMemo(() => {
    const buckets: Record<Group['key'], Employee[]> = {
      skadeleder: [], fugttekniker: [], servicemedarbejder: [],
    };
    for (const e of regularEmployees) {
      buckets[groupForRole(e.role)].push(e);
    }
    for (const k of Object.keys(buckets) as Group['key'][]) {
      buckets[k].sort((a, b) => a.name.localeCompare(b.name, 'da'));
    }
    return buckets;
  }, [regularEmployees]);

  const dayNamesShort = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];

  const setQuick = (kind: 'thisMonth' | 'nextMonth' | 'threeMonths') => {
    if (kind === 'thisMonth') {
      setFromDate(startOfMonth(today));
      setToDate(endOfMonth(today));
    } else if (kind === 'nextMonth') {
      const n = addMonths(today, 1);
      setFromDate(startOfMonth(n));
      setToDate(endOfMonth(n));
    } else {
      setFromDate(today);
      setToDate(addDays(today, 91));
    }
  };

  const DatePickerButton: React.FC<{ date: Date; onChange: (d: Date) => void; label: string }> = ({ date, onChange, label }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="justify-start text-left font-normal gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">{label}:</span>
          {format(date, 'd. MMM yyyy', { locale: da })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          weekStartsOn={1}
          locale={da}
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );

  // Determine the dominant cell kind (priority order), respecting active filters
  const pickKind = (kinds: Set<CellKind> | undefined, leave: boolean): CellKind | null => {
    if (kinds?.has('vacation') && activeKinds.vacation) return 'vacation';
    if (kinds?.has('training') && activeKinds.training) return 'training';
    if (leave && activeKinds.leave) return 'leave';
    if (kinds?.has('skadeleder_vagt') && activeKinds.skadeleder_vagt) return 'skadeleder_vagt';
    if (kinds?.has('kørevagt') && activeKinds['kørevagt']) return 'kørevagt';
    return null;
  };


  const renderEmployeeRow = (emp: Employee, group: Group) => {
    const userMap = cellsByUser.get(emp.id);
    const leave = onLeaveSet.has(emp.id);
    return (
      <tr key={emp.id} className="hover:bg-muted/30">
        <td
          className={cn(
            'sticky left-0 z-10 bg-background border-b border-r px-2 py-1 whitespace-nowrap font-medium text-[12px] border-l-2',
            group.border
          )}
        >
          {emp.name}
        </td>
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const kinds = userMap?.get(key);
          const kind = pickKind(kinds, leave);
          const isToday = isSameDay(d, today);
          const weekend = isWeekend(d);
          const cellBase = cn(
            'border-b border-r p-0 h-6',
            !kind && weekend && 'bg-muted/20',
            !kind && isToday && 'bg-primary/5',
            isToday && 'border-l-2 border-l-primary'
          );
          if (!kind) return <td key={`${emp.id}-${key}`} className={cellBase} />;
          return (
            <td key={`${emp.id}-${key}`} className={cellBase}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn('w-full h-full', cellColor[kind])} />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    {emp.name} — {cellLabel[kind]} {format(d, 'd. MMM', { locale: da })}
                  </div>
                </TooltipContent>
              </Tooltip>
            </td>
          );
        })}
      </tr>
    );
  };

  const totalCols = days.length + 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Oversigt
            </CardTitle>
            <CardDescription>
              Grid-visning grupperet pr. rolle. Viser ferie, kursus, fravær og vagter.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerButton date={fromDate} onChange={setFromDate} label="Fra" />
            <DatePickerButton date={toDate} onChange={setToDate} label="Til" />
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setQuick('thisMonth')}>Denne måned</Button>
              <Button variant="ghost" size="sm" onClick={() => setQuick('nextMonth')}>Næste måned</Button>
              <Button variant="ghost" size="sm" onClick={() => setQuick('threeMonths')}>3 måneder</Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tooManyDays && (
          <div className="text-sm text-destructive mb-3">
            Perioden er for lang ({totalDays} dage). Vælg højst {MAX_DAYS} dage.
          </div>
        )}
        {totalDays <= 0 && (
          <div className="text-sm text-destructive mb-3">Slutdato skal være efter startdato.</div>
        )}

        {!tooManyDays && totalDays > 0 && (
          <TooltipProvider delayDuration={200}>
            <div className="w-full overflow-x-auto border rounded-xl">
              <table className="w-full border-collapse text-xs table-fixed">
                <colgroup>
                  <col style={{ width: 160 }} />
                  {days.map((d) => (
                    <col key={`col-${d.toISOString()}`} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th
                      className="sticky left-0 z-20 bg-muted/50 border-b border-r px-2 py-1 text-left"
                      rowSpan={3}
                    >
                      <span className="font-medium">Medarbejder</span>
                    </th>
                    {weekGroups.map((g, i) => (
                      <th
                        key={`w-${i}-${g.weekNum}`}
                        colSpan={g.span}
                        className="border-b border-r bg-muted/40 text-center font-medium py-1 text-[11px]"
                      >
                        Uge {g.weekNum}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {days.map((d) => {
                      const isToday = isSameDay(d, today);
                      return (
                        <th
                          key={`dn-${d.toISOString()}`}
                          className={cn(
                            'border-b border-r text-center font-normal py-0.5 min-w-[20px]',
                            isWeekend(d) && 'bg-muted/30',
                            isToday && 'bg-primary/10 font-bold'
                          )}
                        >
                          {format(d, 'd')}
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    {days.map((d) => {
                      const isToday = isSameDay(d, today);
                      return (
                        <th
                          key={`dw-${d.toISOString()}`}
                          className={cn(
                            'border-b border-r text-center font-normal py-0.5 text-[10px] text-muted-foreground',
                            isWeekend(d) && 'bg-muted/30',
                            isToday && 'bg-primary/10 text-foreground font-semibold'
                          )}
                        >
                          {dayNamesShort[(d.getDay() + 6) % 7]}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {employeesLoading && (
                    <tr>
                      <td colSpan={totalCols} className="text-center py-4 text-muted-foreground">
                        Indlæser...
                      </td>
                    </tr>
                  )}
                  {!employeesLoading && regularEmployees.length === 0 && (
                    <tr>
                      <td colSpan={totalCols} className="text-center py-4 text-muted-foreground">
                        Ingen medarbejdere i valgt afdeling.
                      </td>
                    </tr>
                  )}
                  {!employeesLoading && GROUPS.map((g) => {
                    const list = grouped[g.key];
                    if (!list || list.length === 0) return null;
                    return (
                      <React.Fragment key={g.key}>
                        <tr className={cn('border-t', g.rowTone)}>
                          <td
                            colSpan={totalCols}
                            className={cn(
                              'sticky left-0 z-10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide',
                              g.tone
                            )}
                          >
                            {g.label} <span className="opacity-60 font-normal normal-case">({list.length})</span>
                          </td>
                        </tr>
                        {list.map((emp) => renderEmployeeRow(emp, g))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="text-muted-foreground mr-1">Filter:</span>
          {([
            { kind: 'vacation' as CellKind, color: 'bg-foreground', label: 'Ferie' },
            { kind: 'training' as CellKind, color: 'bg-yellow-400', label: 'Kursus' },
            { kind: 'leave' as CellKind, color: 'bg-red-500', label: 'Fravær' },
            { kind: 'skadeleder_vagt' as CellKind, color: 'bg-blue-500', label: 'Skadelederv.' },
            { kind: 'kørevagt' as CellKind, color: 'bg-green-500', label: 'Kørevagt' },
          ]).map(({ kind, color, label }) => {
            const active = activeKinds[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => toggleKind(kind)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all',
                  active
                    ? 'bg-background border-border hover:bg-muted/50'
                    : 'bg-muted/30 border-transparent text-muted-foreground opacity-60 hover:opacity-100'
                )}
              >
                <span className={cn('inline-block w-3 h-3 rounded-sm', color, !active && 'opacity-40')} />
                {label}
              </button>
            );
          })}
          <span className="mx-2 h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-muted/40 border rounded-sm" /> Weekend
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block w-3 h-3 border-l-2 border-primary" /> I dag
          </div>
        </div>

        {/* ===== Ugentlig statusbar ===== */}
        {(() => {
          const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
          const weekDayKeys = new Set(weekDays.map((d) => format(d, 'yyyy-MM-dd')));
          const inWeekUsers = (rows: { user_id: string; start_date: string; end_date: string }[]) => {
            const set = new Set<string>();
            for (const r of rows) {
              const s = parseISO(r.start_date);
              const e = parseISO(r.end_date);
              if (e >= weekStart && s <= weekEnd) set.add(r.user_id);
            }
            return set;
          };
          const vacationUsers = inWeekUsers(weekVacations);
          const trainingUsers = inWeekUsers(weekTrainings);
          const skadelederUsers = new Set<string>();
          const korevagtUsers = new Set<string>();
          for (const d of weekDuties) {
            if (!weekDayKeys.has(d.duty_date)) continue;
            if (d.duty_type === 'skadeleder_vagt') skadelederUsers.add(d.employee_id);
            else if (d.duty_type === 'kørevagt') korevagtUsers.add(d.employee_id);
          }
          const leaveUsers = new Set<string>(onLeaveSet);
          const nameOf = (uid: string) =>
            regularEmployees.find((e) => e.id === uid)?.name ?? 'Ukendt';
          const namesFor = (set: Set<string>) =>
            Array.from(set)
              .map(nameOf)
              .sort((a, b) => a.localeCompare(b, 'da'));
          const sections: { kind: CellKind; color: string; label: string; names: string[] }[] = [
            { kind: 'vacation', color: 'bg-foreground', label: 'Ferie', names: namesFor(vacationUsers) },
            { kind: 'training', color: 'bg-yellow-400', label: 'Kursus', names: namesFor(trainingUsers) },
            { kind: 'leave', color: 'bg-red-500', label: 'Fravær', names: namesFor(leaveUsers) },
            { kind: 'skadeleder_vagt', color: 'bg-blue-500', label: 'Skadelederv.', names: namesFor(skadelederUsers) },
            { kind: 'kørevagt', color: 'bg-green-500', label: 'Kørevagt', names: namesFor(korevagtUsers) },
          ];
          const weekNum = getISOWeek(weekStart);
          const isCurrentWeek = isSameDay(weekStart, startOfISOWeek(today));
          return (
            <div className="mt-4 border rounded-xl p-3 bg-muted/20">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setWeekAnchor((w) => addDays(w, -7))}
                  aria-label="Forrige uge"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  Uge {weekNum}
                  <span className="text-muted-foreground font-normal">
                    {' · '}
                    {format(weekStart, 'd. MMM', { locale: da })} – {format(weekEnd, 'd. MMM yyyy', { locale: da })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setWeekAnchor((w) => addDays(w, 7))}
                  aria-label="Næste uge"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isCurrentWeek && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => setWeekAnchor(startOfISOWeek(today))}
                  >
                    I dag
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {sections.map((s) => (
                  <div key={s.kind} className="border rounded-lg p-2 bg-background">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={cn('inline-block w-3 h-3 rounded-sm', s.color)} />
                      <span className="font-medium">{s.label}</span>
                      <span className="ml-auto text-muted-foreground tabular-nums">
                        {s.names.length}
                      </span>
                    </div>
                    {s.names.length === 0 ? (
                      <div className="text-muted-foreground italic">Ingen</div>
                    ) : (
                      <ul className="space-y-0.5">
                        {s.names.map((n) => (
                          <li key={n} className="truncate" title={n}>
                            {n}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </CardContent>

    </Card>
  );
};

export default VacationGridOverview;
