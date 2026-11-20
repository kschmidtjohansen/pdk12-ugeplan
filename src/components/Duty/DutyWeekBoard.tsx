import React, { useMemo } from 'react';
import { addDays, format, getISOWeek, startOfWeek } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import type { Duty } from '@/types/duty';

type BoardDuty = Duty & { sharedDepartmentName?: string | null };

interface DutyWeekBoardProps {
  duties: BoardDuty[];
  /** Any date in the week to show. */
  week: Date;
  onWeekChange: (d: Date) => void;
  todayStr: string;
  onDutyClick: (duty: Duty) => void;
  onAddDuty?: (date: Date) => void;
  /** Rendered at the right of the week row (e.g. the Uge/Måned switch). */
  right?: React.ReactNode;
  /** Name shown in the legend's shared-department chip. */
  sharedName?: string;
}

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
const externalName = (notes?: string | null) =>
  notes?.startsWith('EKSTERN:') ? notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim() : null;

/** Lærredets ugetavle: seven day columns with the day's duties as cards, today highlighted. */
const DutyWeekBoard: React.FC<DutyWeekBoardProps> = ({ duties, week, onWeekChange, todayStr, onDutyClick, onAddDuty, right, sharedName }) => {
  const { t, currentLanguage } = useTranslation();
  const isDa = currentLanguage !== 'en';
  const monday = useMemo(() => startOfWeek(week, { weekStartsOn: 1 }), [week]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const byDay = useMemo(() => {
    const map = new Map<string, BoardDuty[]>();
    duties.forEach(d => map.set(d.duty_date, [...(map.get(d.duty_date) ?? []), d]));
    // Skadeleder first, then kørevagt; stable by name
    map.forEach(list => list.sort((a, b) => (a.duty_type === b.duty_type ? 0 : a.duty_type === 'kørevagt' ? 1 : -1)));
    return map;
  }, [duties]);
  const sunday = days[6];
  const range = monday.getMonth() === sunday.getMonth()
    ? `${format(monday, 'd.')}–${format(sunday, 'd. MMMM', { locale: isDa ? daLocale : undefined })}`
    : `${format(monday, 'd. MMM', { locale: isDa ? daLocale : undefined })} – ${format(sunday, 'd. MMM', { locale: isDa ? daLocale : undefined })}`;

  return (
    <section aria-label={`${t('planner.week')} ${getISOWeek(monday)}`} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card p-1 shadow-flade">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0" aria-label={t('planner.previousWeek')} onClick={() => onWeekChange(addDays(monday, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[7.5rem] px-1 text-center font-display text-sm font-semibold">
            {t('planner.week')} {getISOWeek(monday)} <span className="font-sans font-normal text-muted-foreground">· {range}</span>
          </span>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0" aria-label={t('planner.nextWeek')} onClick={() => onWeekChange(addDays(monday, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-full shadow-flade" onClick={() => onWeekChange(new Date())}>{t('planner.today')}</Button>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="facet-shared-chip">{sharedName ?? (isDa ? 'Afdeling' : 'Dept.')}</span>{isDa ? 'Delt vagt med anden afdeling' : 'Shared with another department'}</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-4 rounded-[4px] border border-dashed border-warning" />{t('duty.unassignedSlot')}</span>
          {right}
        </div>
      </div>

      <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map(day => {
          const key = ymd(day);
          const isToday = key === todayStr;
          const list = byDay.get(key) ?? [];
          return (
            <li key={key} className={cn('facet-card flex min-h-[15rem] flex-col gap-2 p-2.5', isToday && 'facet-duty-today')}>
              <div className="relative flex min-h-6 items-center px-1 pr-7 pt-0.5">
                <span className={cn('truncate whitespace-nowrap text-xs font-semibold uppercase tracking-[0.04em]', isToday ? 'text-primary-strong' : 'text-muted-foreground')}>
                  {format(day, 'EEE d.', { locale: isDa ? daLocale : undefined }).replace('.', '')}{isToday && ` · ${t('planner.today')}`}
                </span>
                {onAddDuty && (
                  <button type="button" onClick={() => onAddDuty(day)} aria-label={`${t('duty.assignDuty')} ${format(day, 'd. MMMM', { locale: isDa ? daLocale : undefined })}`}
                    className="absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {list.map(d => {
                const name = externalName(d.notes) || d.employee?.name || null;
                const kind = d.duty_type === 'kørevagt' ? t('duty.kørevagt') : t('duty.skadelederVagt');
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onDutyClick(d)}
                    className={cn(
                      'flex w-full flex-col gap-1.5 rounded-[12px] border px-2.5 py-2 text-left transition-[background-color,box-shadow] duration-140 ease-facet hover:shadow-flade',
                      !name ? 'border-dashed border-warning bg-warning-soft/60' : d.sharedDepartmentName ? 'facet-duty-shared' : 'border-border/70 bg-card',
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-primary-foreground dark:text-foreground">
                      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', d.duty_type === 'kørevagt' ? 'bg-success' : 'bg-info')} />
                      {kind}
                    </span>
                    {name ? (
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                        <span aria-hidden className="facet-mini-avatar">{initials(name)}</span>
                        <span className="truncate">{name}</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-warning-soft-foreground">{t('duty.unassignedSlot')}</span>
                    )}
                    {d.sharedDepartmentName && <span className="facet-shared-chip self-start">{d.sharedDepartmentName}</span>}
                  </button>
                );
              })}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default React.memo(DutyWeekBoard);
