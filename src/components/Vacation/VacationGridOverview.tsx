import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, CalendarIcon } from 'lucide-react';
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
} from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

const MAX_DAYS = 92;

interface VacationRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
}

const VacationGridOverview: React.FC = () => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const { isDemoMode } = useAuth();
  const { regularEmployees, loading: employeesLoading } = useEmployees();

  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState<Date>(today);
  const [toDate, setToDate] = useState<Date>(addDays(today, 30));

  const totalDays = differenceInCalendarDays(toDate, fromDate) + 1;
  const tooManyDays = totalDays > MAX_DAYS;

  const days = useMemo(() => {
    if (tooManyDays || totalDays <= 0) return [] as Date[];
    return eachDayOfInterval({ start: fromDate, end: toDate });
  }, [fromDate, toDate, tooManyDays, totalDays]);

  const rangeStart = format(fromDate, 'yyyy-MM-dd');
  const rangeEnd = format(toDate, 'yyyy-MM-dd');

  const { data: vacations = [] } = useQuery({
    queryKey: ['vacation-grid', selectedDepartmentId, rangeStart, rangeEnd, isDemoMode],
    enabled: !!selectedDepartmentId && !tooManyDays,
    queryFn: async (): Promise<VacationRow[]> => {
      let query = supabase
        .from('vacations')
        .select('id, user_id, start_date, end_date, department_id')
        .eq('status', 'approved')
        .eq('is_demo', isDemoMode)
        .lte('start_date', rangeEnd)
        .gte('end_date', rangeStart);

      if (selectedDepartmentId) {
        query = query.eq('department_id', selectedDepartmentId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as VacationRow[];
    },
  });

  // Map user_id -> Set of day keys (yyyy-MM-dd) on vacation
  const vacByUser = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const v of vacations) {
      const start = parseISO(v.start_date);
      const end = parseISO(v.end_date);
      const vDays = eachDayOfInterval({
        start: start < fromDate ? fromDate : start,
        end: end > toDate ? toDate : end,
      });
      let set = map.get(v.user_id);
      if (!set) {
        set = new Set();
        map.set(v.user_id, set);
      }
      for (const d of vDays) set.add(format(d, 'yyyy-MM-dd'));
    }
    return map;
  }, [vacations, fromDate, toDate]);

  // Week groupings for header row 3
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

  const sortedEmployees = useMemo(
    () => [...regularEmployees].sort((a, b) => a.name.localeCompare(b.name, 'da')),
    [regularEmployees]
  );

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

  const DatePickerButton: React.FC<{ date: Date; onChange: (d: Date) => void; label: string }> = ({
    date,
    onChange,
    label,
  }) => (
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Ferieoversigt
            </CardTitle>
            <CardDescription>
              Grid-visning af godkendte ferier pr. medarbejder i valgt periode.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerButton date={fromDate} onChange={setFromDate} label="Fra" />
            <DatePickerButton date={toDate} onChange={setToDate} label="Til" />
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setQuick('thisMonth')}>
                Denne måned
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setQuick('nextMonth')}>
                Næste måned
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setQuick('threeMonths')}>
                3 måneder
              </Button>
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
            <div className="overflow-x-auto border rounded-xl">
              <table className="border-collapse text-xs">
                <thead>
                  {/* Week row */}
                  <tr>
                    <th
                      className="sticky left-0 z-20 bg-muted/50 border-b border-r px-2 py-1 text-left min-w-[140px]"
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
                  {/* Day number row */}
                  <tr>
                    {days.map((d) => {
                      const isToday = isSameDay(d, today);
                      return (
                        <th
                          key={`dn-${d.toISOString()}`}
                          className={cn(
                            'border-b border-r text-center font-normal py-0.5 w-[28px] min-w-[28px]',
                            isWeekend(d) && 'bg-muted/30',
                            isToday && 'bg-primary/10 font-bold'
                          )}
                        >
                          {format(d, 'd')}
                        </th>
                      );
                    })}
                  </tr>
                  {/* Day-of-week row */}
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
                      <td colSpan={days.length + 1} className="text-center py-4 text-muted-foreground">
                        Indlæser...
                      </td>
                    </tr>
                  )}
                  {!employeesLoading && sortedEmployees.length === 0 && (
                    <tr>
                      <td colSpan={days.length + 1} className="text-center py-4 text-muted-foreground">
                        Ingen medarbejdere i valgt afdeling.
                      </td>
                    </tr>
                  )}
                  {sortedEmployees.map((emp) => {
                    const userDays = vacByUser.get(emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-muted/20">
                        <td className="sticky left-0 z-10 bg-background border-b border-r px-2 py-1 whitespace-nowrap font-medium">
                          {emp.name}
                        </td>
                        {days.map((d) => {
                          const key = format(d, 'yyyy-MM-dd');
                          const onVacation = userDays?.has(key);
                          const isToday = isSameDay(d, today);
                          const weekend = isWeekend(d);
                          return (
                            <td
                              key={`${emp.id}-${key}`}
                              className={cn(
                                'border-b border-r p-0 h-6 w-[28px] min-w-[28px]',
                                weekend && !onVacation && 'bg-muted/20',
                                isToday && !onVacation && 'bg-primary/5',
                                isToday && 'border-l-2 border-l-primary'
                              )}
                            >
                              {onVacation ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-full h-full bg-red-500/85 hover:bg-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      {emp.name} — ferie {format(d, 'd. MMM', { locale: da })}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-red-500/85 rounded-sm" /> Godkendt ferie
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-muted/40 border rounded-sm" /> Weekend
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border-l-2 border-primary" /> I dag
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VacationGridOverview;
