import React, { Suspense, lazy, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { MapPinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlidingSegments } from '@/components/ui/sliding-segments';
import type { Assignment } from '@/types/assignment';
import { shortPlace } from '@/lib/employeeToday';

const DayMap = lazy(() => import('@/components/Dashboard/DayMap'));

interface Props {
  days: string[];
  day: string;
  onDayChange: (d: string) => void;
  assignments: Assignment[];
  selectedId: string | null;
  onSelect: (a: Assignment) => void;
  nowMin: number;
  da: boolean;
}

const t5 = (t?: string) => (t || '').slice(0, 5);

/** Lærredets Kort: dagens opgaver som nummererede nåle med listen ved siden af. */
const PlannerMapView: React.FC<Props> = ({ days, day, onDayChange, assignments, selectedId, onSelect, nowMin, da }) => {
  const list = useMemo(() => assignments.filter(a => a.date === day).sort((x, y) => t5(x.fromTime).localeCompare(t5(y.fromTime))), [assignments, day]);
  const items = list.map((assignment, i) => ({ assignment, n: i + 1 }));
  const locale = da ? daLocale : undefined;
  return (
    <div className="space-y-3">
      <SlidingSegments ariaLabel={da ? 'Dag' : 'Day'} value={day} onChange={onDayChange}
        segments={days.map(d => ({ key: d, label: format(parseISO(d), 'EEE d.', { locale }) }))} className="max-w-full overflow-x-auto" />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="facet-card overflow-hidden">
          <Suspense fallback={<div className="h-[520px] bg-muted" />}>
            <DayMap items={items} nowMin={nowMin} onOpen={onSelect} className="h-[520px]" />
          </Suspense>
        </div>
        <ol className="facet-card max-h-[520px] space-y-1 overflow-y-auto p-2">
          {items.length === 0 && <li className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><MapPinOff aria-hidden className="h-4 w-4" />{da ? 'Ingen opgaver denne dag.' : 'No tasks this day.'}</li>}
          {items.map(({ assignment: a, n }) => (
            <li key={a.id}>
              <button type="button" onClick={() => onSelect(a)} aria-pressed={a.id === selectedId}
                className={cn('flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-muted', a.id === selectedId && 'bg-accent')}>
                <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-[11px] font-bold text-primary-strong">{n}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t5(a.fromTime)}–{t5(a.toTime)} · {shortPlace(a.location)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PlannerMapView;
