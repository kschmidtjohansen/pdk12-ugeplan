import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { format } from 'date-fns';
import { MapPin, Users, Car as CarIcon, CalendarCheck } from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { useCars } from '@/hooks/car';
import { Assignment } from '@/types/assignment';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { cn } from '@/lib/utils';

const AssignmentDetailsDialog = lazy(() => import('./AssignmentDetailsDialog'));

const toMin = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

const TodayTimeline: React.FC = () => {
  const { assignments, loading } = useAssignments();
  const { cars } = useCars();
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [selected, setSelected] = useState<Assignment | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const items = useMemo(
    () => (assignments ?? []).filter(a => a.date === todayStr).sort((a, b) => toMin(a.fromTime) - toMin(b.fromTime)),
    [assignments, todayStr]
  );

  const carNames = (a: Assignment) => {
    const ids = a.cars?.length ? a.cars : typeof a.car === 'string' ? [a.car] : a.car?.id ? [a.car.id] : [];
    return ids.map(id => cars.find(c => c.id === id)?.name).filter(Boolean).join(', ');
  };
  const people = (a: Assignment) => (a.assignedEmployees ?? []).map(e => e.name.split(' ')[0]).join(', ');

  if (loading && items.length === 0) return <ListSkeleton variant="card" rowCount={3} />;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center">
        <CalendarCheck className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Ingen sager i dag</p>
      </div>
    );
  }

  // Index where the "now" marker should be inserted
  const nowIdx = items.findIndex(a => toMin(a.fromTime) > nowMin);

  return (
    <ol className="relative ml-2 border-l border-border/60">
      {items.map((a, i) => {
        const start = toMin(a.fromTime);
        const end = toMin(a.toTime);
        const current = nowMin >= start && nowMin <= end;
        const past = nowMin > end;
        const team = people(a);
        const carTxt = carNames(a);
        return (
          <React.Fragment key={a.id}>
            {i === nowIdx && !items.some(x => nowMin >= toMin(x.fromTime) && nowMin <= toMin(x.toTime)) && <NowMarker />}
            <li className={cn('relative pb-4 pl-5 last:pb-0', past && 'opacity-55')}>
              <span className="absolute -left-[5px] top-2 flex h-2.5 w-2.5">
                {current && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />}
                <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', current ? 'bg-primary' : past ? 'bg-muted-foreground/40' : 'bg-border')} />
              </span>
              <button
                type="button"
                onClick={() => setSelected(a)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/50',
                  current && 'bg-primary/5 ring-1 ring-primary/25'
                )}
              >
                <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{a.fromTime?.slice(0, 5)}–{a.toTime?.slice(0, 5)}</span>
                  {a.case_number && <span>#{a.case_number}</span>}
                  {current && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">I gang nu</span>}
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{a.title}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {a.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{[a.location, a.city].filter(Boolean).join(', ')}</span>}
                  {team && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{team}</span>}
                  {carTxt && <span className="inline-flex items-center gap-1"><CarIcon className="h-3 w-3" />{carTxt}</span>}
                </div>
              </button>
            </li>
          </React.Fragment>
        );
      })}
      {nowIdx === -1 && !items.some(x => nowMin >= toMin(x.fromTime) && nowMin <= toMin(x.toTime)) && <NowMarker />}

      {selected && (
        <Suspense fallback={null}>
          <AssignmentDetailsDialog assignment={selected} cars={cars} isOpen onClose={() => setSelected(null)} />
        </Suspense>
      )}
    </ol>
  );
};

const NowMarker: React.FC = () => (
  <li className="relative pb-4 pl-5" aria-label="Nu">
    <span className="absolute -left-[4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">Nu {format(new Date(), 'HH:mm')}</span>
      <span className="h-px flex-1 bg-primary/30" />
    </div>
  </li>
);

export default TodayTimeline;
