import React from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import type { Assignment } from '@/types/assignment';
import { initials } from '@/lib/employeeToday';
import { loadTone, type BoardRow } from '@/lib/plannerBoard';
import { assignmentTypeInfo } from './assignmentType';

interface Props {
  rows: BoardRow[];
  days: string[];
  today: string;
  selectedId: string | null;
  onSelect: (a: Assignment) => void;
  onCreate?: (date: string) => void;
  carLabel: (a: Assignment) => string | null;
  roleLabel: (role: string) => string;
}

const t5 = (t?: string) => (t || '').slice(0, 5);

/** Lærredets Tavle: medarbejdere × dage med opgaver, fravær, belægning og konflikter. Klik på en opgave åbner sidepanelet. */
const PlannerBoard: React.FC<Props> = ({ rows, days, today, selectedId, onSelect, onCreate, carLabel, roleLabel }) => {
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const locale = da ? daLocale : undefined;
  const cols = { gridTemplateColumns: `10.5rem repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="facet-card overflow-x-auto">
      <div role="table" aria-label={da ? 'Ugetavle' : 'Week board'} className="min-w-[720px]">
        <div role="row" className="grid border-b border-border" style={cols}>
          <div role="columnheader" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{da ? 'Medarbejder' : 'Employee'}</div>
          {days.map(d => {
            const isToday = d === today, day = parseISO(d);
            return (
              <div role="columnheader" key={d} className={cn('flex items-center gap-2 px-3 py-3', isToday && 'bg-primary/5')}>
                <span className={cn('text-[11px] font-semibold uppercase tracking-[0.06em]', isToday ? 'text-primary-strong' : 'text-muted-foreground')}>{format(day, 'EEE', { locale }).replace('.', '')}</span>
                <span className={cn('font-display text-[15px] font-bold', isToday && 'rounded-full bg-primary px-2 text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.55)]')}>{format(day, 'd')}</span>
                {isToday && <span className="sr-only text-xs font-semibold text-primary-strong 2xl:not-sr-only">{da ? 'I dag' : 'Today'}</span>}
              </div>
            );
          })}
        </div>
        {rows.map(r => {
          const name = r.employee?.name ?? (da ? 'Uden medarbejder' : 'No employee');
          return (
            <div role="row" key={r.employee?.id ?? 'none'} className="grid min-h-[92px] border-b border-border/70 last:border-b-0" style={cols}>
              <div role="rowheader" className="flex items-start gap-2 px-3 py-3">
                <span aria-hidden className={cn('flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-card',
                  r.employee ? 'bg-accent text-primary-strong' : 'bg-warning-soft text-warning-soft-foreground', r.conflicts && 'outline outline-2 outline-offset-2 outline-destructive/60')}>
                  {r.employee ? initials(name) : '?'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.employee ? (r.employee.jobTitle || roleLabel(r.employee.role)) : (da ? 'Mangler hold' : 'Needs crew')}</span>
                </span>
              </div>
              {r.cells.map(c => (
                <div role="cell" key={c.date} className={cn('group relative flex flex-col gap-1.5 px-1.5 pb-2.5 pt-2', c.date === today && 'bg-primary/5')}>
                  {c.off && <span className="facet-hatch-off m-auto rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground">{c.off}</span>}
                  {c.partOff && <span className="self-start rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning-soft-foreground">{c.partOff}</span>}
                  {c.tasks.map(a => {
                    const { Icon, key } = assignmentTypeInfo(a.type);
                    const on = a.id === selectedId, car = carLabel(a);
                    const bad = c.conflict && r.employee !== null;
                    return (
                      <button key={a.id} type="button" onClick={() => onSelect(a)} aria-pressed={on}
                        aria-label={`${t(key)}: ${a.title}, ${t5(a.fromTime)}–${t5(a.toTime)}${a.published ? '' : da ? ', ikke publiceret' : ', not published'}`}
                        className={cn('flex rounded-xl border bg-card p-2 text-left shadow-flade transition-[box-shadow,transform] duration-140 ease-facet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          a.published ? 'border-border/70' : 'border-dashed border-muted-foreground/50',
                          on ? '-translate-y-0.5 ring-2 ring-primary' : bad ? 'ring-[1.5px] ring-destructive' : 'hover:-translate-y-0.5')}>
                        <span className="flex min-w-0 flex-1 flex-col gap-px">
                          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                            <span aria-hidden className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-info-soft text-info-soft-foreground"><Icon className="h-2.5 w-2.5" /></span>
                            <span className="truncate">{t5(a.fromTime)}–{t5(a.toTime)}</span>
                          </span>
                          <span className="line-clamp-2 text-[13px] font-semibold leading-[17px] text-foreground [overflow-wrap:anywhere]">{a.title}</span>
                          <span className={cn('truncate text-xs', car ? 'text-muted-foreground' : 'font-semibold text-warning-soft-foreground')}>{car ?? (da ? 'Mangler bil' : 'No car')}</span>
                        </span>
                      </button>
                    );
                  })}
                  {onCreate && !c.off && (
                    <button type="button" onClick={() => onCreate(c.date)} aria-label={`${da ? 'Ny opgave' : 'New task'} ${format(parseISO(c.date), 'EEEE d. MMM', { locale })}`}
                      className="flex h-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover:opacity-100">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {r.employee && !c.off && (
                    <span role="img" aria-label={`${da ? 'Booket' : 'Booked'} ${c.load} %`} className="mt-auto flex h-1 overflow-hidden rounded-full bg-muted">
                      <span className={cn('rounded-full', loadTone(c.load))} style={{ width: `${Math.min(c.load, 100)}%` }} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlannerBoard;
