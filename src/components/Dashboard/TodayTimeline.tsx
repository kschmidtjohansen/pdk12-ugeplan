import React, { useEffect, useRef, useMemo, useState, Suspense, lazy } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { MapPin, Users, Car as CarIcon, CalendarCheck } from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { useCars } from '@/hooks/car';
import { Assignment } from '@/types/assignment';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';

const AssignmentDetailsDialog = lazy(() => import('./AssignmentDetailsDialog'));
const DayMap = lazy(() => import('./DayMap'));

const toMin = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

interface TodayTimelineProps {
  active?: boolean;
  onlyMine?: boolean;
  /** Show Dagskortet next to the list (Dashboard). */
  withMap?: boolean;
}

const TodayTimeline: React.FC<TodayTimelineProps> = ({ active = true, onlyMine = false, withMap = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentRef = useRef<HTMLLIElement>(null);
  const { assignments, loading } = useAssignments();
  const { cars } = useCars();
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [selected, setSelected] = useState<Assignment | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const itemsReady = !loading;
  useEffect(() => {
    if (active && itemsReady && window.innerWidth < 640) {
      currentRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }
  }, [active, itemsReady]);
  const items = useMemo(
    () => (assignments ?? [])
      .filter(a => a.date === todayStr)
      .filter(a => {
        if (!onlyMine || !user?.id) return true;
        const isResp = (a.responsibleUser?.id ?? a.responsibleUserId) === user.id;
        const isAssigned = a.assignedEmployees?.some(e => e.id === user.id) ?? false;
        const isLegacy = Array.isArray(a.employees) && a.employees.includes(user.id);
        return isResp || isAssigned || isLegacy;
      })
      .sort((a, b) => toMin(a.fromTime) - toMin(b.fromTime)),
    [assignments, todayStr, onlyMine, user?.id]
  );

  const carNames = (a: Assignment) => {
    const ids = a.cars?.length ? a.cars : typeof a.car === 'string' ? [a.car] : a.car?.id ? [a.car.id] : [];
    return ids.map(id => cars.find(c => c.id === id)?.name).filter(Boolean).join(', ');
  };
  const people = (a: Assignment) => (a.assignedEmployees ?? []).map(e => e.name.split(' ')[0]).join(', ');

  const dialog = selected && (
    <Suspense fallback={null}>
      <AssignmentDetailsDialog assignment={selected} cars={cars} isOpen onClose={() => setSelected(null)} />
    </Suspense>
  );

  const anyCurrent = items.some(x => nowMin >= toMin(x.fromTime) && nowMin <= toMin(x.toTime));
  // Index where the "now" marker should be inserted
  const nowIdx = items.findIndex(a => toMin(a.fromTime) > nowMin);

  let list: React.ReactNode;
  if (loading && items.length === 0) {
    list = <ListSkeleton variant="card" rowCount={3} />;
  } else if (items.length === 0) {
    list = (
      <div className="facet-card px-4 py-12 text-center">
        <CalendarCheck className="mx-auto mb-2 h-7 w-7 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t('ui.noCasesToday')}</p>
      </div>
    );
  } else {
    list = (
      <section aria-labelledby="dagsforloeb-title" className="facet-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4 sm:px-5">
          <h2 id="dagsforloeb-title" className="font-display text-base font-semibold tracking-tight text-foreground">{t('ui.dayFlow')}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{items.length === 1 ? t('ui.dayTasksOne') : t('ui.dayTasksMany', { count: items.length })}</span>
          {withMap && <Link to="/planner" className="ml-auto rounded-control px-2 py-1 text-xs font-semibold text-primary-strong transition-colors duration-140 ease-facet hover:bg-sidebar-accent">{t('navigation.planner')}</Link>}
        </div>
        <ol className="relative flex flex-col gap-0.5 px-2 pb-2 sm:px-3">
          {items.map((a, i) => {
            const start = toMin(a.fromTime);
            const end = toMin(a.toTime);
            const current = nowMin >= start && nowMin <= end;
            const team = people(a);
            const carTxt = carNames(a);
            return (
              <React.Fragment key={a.id}>
                {i === nowIdx && !anyCurrent && <NowMarker label={t('ui.nowAt', { time: format(new Date(), 'HH:mm') })} />}
                <li ref={current ? currentRef : undefined} className="relative">
                  <Button variant="ghost" type="button" onClick={() => setSelected(a)}
                    className={cn('grid h-auto sm:h-auto min-h-20 w-full grid-cols-[30px_minmax(0,1fr)] gap-3 rounded-card px-2.5 py-3 text-left whitespace-normal transition-[background-color,box-shadow] duration-140 ease-facet hover:bg-sidebar-accent/70 sm:grid-cols-[30px_72px_minmax(0,1fr)] sm:px-3', current && 'facet-row-now', !current && end < nowMin && 'opacity-60')}>
                    <span className={cn('facet-map-pin facet-map-pin-sm mt-0.5', current && 'is-now')} aria-hidden>{i + 1}</span>
                    <span className="col-start-2 flex items-center gap-2 text-xs tabular-nums sm:col-start-auto sm:flex-col sm:items-start sm:gap-0.5 sm:pt-0.5">
                      <span className="font-mono text-sm font-medium text-foreground">{a.fromTime?.slice(0, 5)}</span>
                      <span className="font-mono text-muted-foreground">– {a.toTime?.slice(0, 5)}</span>
                    </span>
                    <span className="col-start-2 min-w-0 space-y-1.5 sm:col-start-auto">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground break-words">{a.title}</span>
                        {current && <Badge variant="info" className="whitespace-normal">{t('ui.inProgressNow')}</Badge>}
                        {a.case_number && <span className="font-mono text-xs text-muted-foreground tabular-nums">#{a.case_number}</span>}
                      </span>
                      {a.location && <span className="flex items-start gap-2 text-xs text-muted-foreground"><MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{[a.location, a.city].filter(Boolean).join(', ')}</span></span>}
                      {(team || carTxt) && (
                        <span className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                          {team && <span className="flex items-start gap-2"><Users aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{team}</span></span>}
                          {carTxt && <span className="flex items-start gap-2"><CarIcon aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{carTxt}</span></span>}
                        </span>
                      )}
                    </span>
                  </Button>
                </li>
              </React.Fragment>
            );
          })}
          {nowIdx === -1 && !anyCurrent && <NowMarker label={t('ui.nowAt', { time: format(new Date(), 'HH:mm') })} />}
        </ol>
      </section>
    );
  }

  if (!withMap) return <>{list}{dialog}</>;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,1fr)] xl:items-start">
      <div className="min-w-0">{list}</div>
      <Suspense fallback={<div className="facet-card facet-skeleton h-72 lg:h-80" />}>
        <DayMap
          items={items.map((assignment, i) => ({ assignment, n: i + 1 }))}
          nowMin={nowMin}
          onOpen={setSelected}
          className="h-72 lg:h-80 xl:sticky xl:top-24 xl:h-[min(520px,calc(100dvh-8rem))]"
        />
      </Suspense>
      {dialog}
    </div>
  );
};

const NowMarker: React.FC<{ label: string }> = ({ label }) => (
  <li className="flex items-center gap-2 px-2 py-2 sm:px-3" aria-label={label}>
    <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[11px] font-medium text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.6)]">{label}</span>
    <span aria-hidden className="facet-now-line flex-1" />
  </li>
);

export default TodayTimeline;
