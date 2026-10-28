import React, { useEffect, useRef, useMemo, useState, Suspense, lazy } from 'react';
import { format } from 'date-fns';
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

const toMin = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

const TodayTimeline: React.FC<{ active?: boolean; onlyMine?: boolean }> = ({ active = true, onlyMine = false }) => {
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

  if (loading && items.length === 0) return <ListSkeleton variant="card" rowCount={3} />;

  if (items.length === 0) {
    return (
      <div className="border-y border-border px-4 py-12 text-center">
        <CalendarCheck className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('ui.noCasesToday')}</p>
      </div>
    );
  }

  // Index where the "now" marker should be inserted
  const nowIdx = items.findIndex(a => toMin(a.fromTime) > nowMin);

  return (
    <ol className="relative divide-y divide-border border-y border-border">
      {items.map((a, i) => {
        const start = toMin(a.fromTime);
        const end = toMin(a.toTime);
        const current = nowMin >= start && nowMin <= end;
        const team = people(a);
        const carTxt = carNames(a);
        return (
          <React.Fragment key={a.id}>
            {i === nowIdx && !items.some(x => nowMin >= toMin(x.fromTime) && nowMin <= toMin(x.toTime)) && <NowMarker />}
            <li ref={current ? currentRef : undefined} className="relative">
              <Button variant="ghost" type="button" onClick={() => setSelected(a)}
                className={cn('grid h-auto sm:h-auto min-h-24 w-full grid-cols-[minmax(0,1fr)] gap-3 rounded-none border-l-2 border-transparent px-3 py-4 text-left whitespace-normal sm:grid-cols-[88px_minmax(0,1fr)] sm:px-4', current && 'border-primary bg-accent')}>
                <span className="flex items-center gap-2 sm:flex-col sm:items-start text-xs tabular-nums">
                  <span className="font-semibold text-foreground">{a.fromTime?.slice(0, 5)}</span>
                  <span className="text-muted-foreground">– {a.toTime?.slice(0, 5)}</span>
                </span>
                <span className="min-w-0 space-y-2">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground break-words">{a.title}</span>
                    {current && <Badge variant="info" className="whitespace-normal">{t('ui.inProgressNow')}</Badge>}
                    {a.case_number && <span className="text-xs text-muted-foreground tabular-nums">#{a.case_number}</span>}
                  </span>
                  {a.location && <span className="flex items-start gap-2 text-xs text-muted-foreground"><MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{[a.location, a.city].filter(Boolean).join(', ')}</span></span>}
                  <span className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    {team && <span className="flex items-start gap-2"><Users aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{team}</span></span>}
                    {carTxt && <span className="flex items-start gap-2"><CarIcon aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{carTxt}</span></span>}
                  </span>
                </span>
              </Button>
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
  <li className="relative py-3 px-3 sm:px-4" aria-label="Nu">
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-info-soft-foreground">Nu {format(new Date(), 'HH:mm')}</span>
      <span className="h-px flex-1 bg-primary/30" />
    </div>
  </li>
);

export default TodayTimeline;
