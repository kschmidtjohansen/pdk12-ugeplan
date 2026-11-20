import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useOnlineStatus, saveSnapshot, loadSnapshot } from '@/hooks/useOfflineTodaySnapshot';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Navigation, Phone, MapPin, Car as CarIcon, Users, Package, CalendarCheck, MessageSquare, CloudOff, Droplets, Flame, Sprout, Wrench, UserRound, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriveEstimates, formatDrive } from '@/hooks/useDriveEstimates';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useCars } from '@/hooks/car';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouseIndicators } from '@/hooks/warehouse/useWarehouseIndicators';
import ListSkeleton from '@/components/shared/ListSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import CaseNumber from '@/components/shared/CaseNumber';
import { Assignment } from '@/types/assignment';

const AssignmentDetailsDialog = lazy(() => import('./AssignmentDetailsDialog'));
const OnMyWaySmsDialog = lazy(() => import('./OnMyWaySmsDialog'));

const toMinutes = (time?: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

/** Scroll position that puts a card in the middle of the deck (matches snap-center). */
const centeredLeft = (deck: HTMLElement, card: HTMLElement) =>
  Math.max(0, card.offsetLeft - deck.offsetLeft - (deck.clientWidth - card.offsetWidth) / 2);

const buildFullAddress = (assignment: Assignment): string =>
  [assignment.location, assignment.zip_code, assignment.city].filter(Boolean).join(', ');

const MinDag: React.FC = () => {
  const { user } = useAuth();
  const { currentLanguage, t } = useTranslation();
  const isDa = currentLanguage === 'da';
  const { assignments, loading, error, fetchAssignments } = useAssignmentDataOptimized();
  const { cars } = useCars();
  const { employees } = useEmployees();
  const { data: warehouseIndicators } = useWarehouseIndicators();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [smsCaseNumber, setSmsCaseNumber] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const myAssignments = useMemo(() => {
    if (!user?.id || !assignments) return [] as Assignment[];
    return assignments.filter(a => {
      const viaNew = a.assignedEmployees?.some(emp => emp.id === user.id) ?? false;
      const viaLegacy = Array.isArray(a.employees) && a.employees.includes(user.id);
      const isResponsible = (a.responsibleUser?.id ?? a.responsibleUserId) === user.id;
      return viaNew || viaLegacy || isResponsible;
    });
  }, [assignments, user]);

  const liveTodayAssignments = useMemo(
    () =>
      myAssignments
        .filter(a => a.date === todayStr)
        .sort((a, b) => toMinutes(a.fromTime) - toMinutes(b.fromTime)),
    [myAssignments, todayStr]
  );

  const reconnect = useCallback(() => { fetchAssignments(); }, [fetchAssignments]);
  const online = useOnlineStatus(reconnect);

  // Save a snapshot after each successful load (only when online with real data)
  useEffect(() => {
    if (!user?.id || loading || error || !online) return;
    const phones: Record<string, string> = {};
    employees.forEach(e => { if (e.phone) phones[e.id] = e.phone; });
    saveSnapshot(user.id, todayStr, liveTodayAssignments, phones);
  }, [user?.id, todayStr, liveTodayAssignments, employees, loading, error, online]);

  const snapshot = useMemo(
    () => (user?.id && (!online || error) ? loadSnapshot(user.id, todayStr) : null),
    [user?.id, online, error, todayStr]
  );
  const isOfflineMode = !!snapshot && (!online || (!!error && liveTodayAssignments.length === 0));
  const todayAssignments = isOfflineMode ? snapshot!.assignments : liveTodayAssignments;

  const nextAssignment = useMemo(() => {
    if (todayAssignments.length > 0) return null;
    const future = myAssignments
      .filter(a => a.date > todayStr)
      .sort((a, b) => (a.date === b.date ? toMinutes(a.fromTime) - toMinutes(b.fromTime) : a.date.localeCompare(b.date)));
    return future[0] ?? null;
  }, [myAssignments, todayAssignments, todayStr]);

  const getCarNames = (assignment: Assignment): string[] => {
    const names: string[] = [];
    if (Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      assignment.cars.forEach(carId => {
        const car = cars.find(c => c.id === carId);
        if (car) names.push(car.name);
      });
    } else if (assignment.car) {
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) names.push(car.name);
      } else if (assignment.car.name) {
        names.push(assignment.car.name);
      }
    }
    return names;
  };

  const getColleagues = (assignment: Assignment): string[] => {
    const ids = new Set<string>();
    assignment.assignedEmployees?.forEach(emp => ids.add(emp.id));
    if (Array.isArray(assignment.employees)) assignment.employees.forEach(id => ids.add(id));
    ids.delete(user?.id ?? '');
    return Array.from(ids)
      .map(id => assignment.assignedEmployees?.find(e => e.id === id)?.name || employees.find(e => e.id === id)?.name)
      .filter((n): n is string => !!n);
  };

  const getResponsible = (assignment: Assignment) => {
    const id = assignment.responsibleUser?.id ?? assignment.responsibleUserId;
    if (!id) return null;
    const employee = employees.find(e => e.id === id);
    return {
      id,
      name: assignment.responsibleUser?.name || employee?.name || '',
      phone: employee?.phone || snapshot?.phones[id] || '',
    };
  };

  const getWarehouseCount = (assignment: Assignment): number => {
    if (!warehouseIndicators) return 0;
    const data =
      (assignment.case_number && warehouseIndicators.get(assignment.case_number)) ||
      warehouseIndicators.get(assignment.title) ||
      { count: 0, totalQuantity: 0 };
    return data.totalQuantity;
  };

  const handleNavigate = (assignment: Assignment) => {
    const address = buildFullAddress(assignment);
    if (!address) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    window.open(
      isIOS
        ? `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleRetry = async () => {
    setRetrying(true);
    await fetchAssignments();
    setRetrying(false);
  };

  const headerDate = format(new Date(), 'EEEE d. MMM', { locale: isDa ? daLocale : undefined });

  // The card in focus: what is happening now, else the next one, else the last one.
  const focusIndex = useMemo(() => {
    if (todayAssignments.length === 0) return -1;
    const now = todayAssignments.findIndex(a => nowMinutes >= toMinutes(a.fromTime) && nowMinutes <= toMinutes(a.toTime));
    if (now !== -1) return now;
    const next = todayAssignments.findIndex(a => toMinutes(a.fromTime) > nowMinutes);
    return next !== -1 ? next : todayAssignments.length - 1;
  }, [todayAssignments, nowMinutes]);
  const focus = focusIndex >= 0 ? todayAssignments[focusIndex] : null;
  const focusIsNow = !!focus && nowMinutes >= toMinutes(focus.fromTime) && nowMinutes <= toMinutes(focus.toTime);
  const focusIsAhead = !!focus && toMinutes(focus.fromTime) > nowMinutes;

  // Swipeable deck of today's tasks, starting at the focus card.
  const deckRef = useRef<HTMLOListElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || focusIndex < 0) return;
    const card = deck.children[focusIndex] as HTMLElement | undefined;
    if (card) deck.scrollTo({ left: centeredLeft(deck, card), behavior: 'auto' });
    setVisibleIndex(focusIndex);
  }, [focusIndex, todayAssignments.length]);
  const onDeckScroll = () => {
    const deck = deckRef.current;
    if (!deck) return;
    const center = deck.scrollLeft + deck.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    Array.from(deck.children).forEach((el, i) => {
      const c = (el as HTMLElement).offsetLeft - deck.offsetLeft + (el as HTMLElement).offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setVisibleIndex(best);
  };
  const scrollToCard = (i: number) => {
    const deck = deckRef.current;
    const card = deck?.children[i] as HTMLElement | undefined;
    if (!deck || !card) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    deck.scrollTo({ left: centeredLeft(deck, card), behavior: reduce ? 'auto' : 'smooth' });
  };
  const upNext = todayAssignments[visibleIndex + 1];

  const drives = useDriveEstimates(todayStr, todayAssignments.map(a => a.id).join(','), online && !isOfflineMode && todayAssignments.length > 1);
  const focusDrive = focus && focusIsAhead ? drives.get(focus.id) : undefined;

  const openDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  const typeInfo = (type?: string) => {
    switch (type) {
      case 'waterDamage': return { Icon: Droplets, label: t('dashboard.assignments.waterDamage') };
      case 'fireDamage': return { Icon: Flame, label: t('dashboard.assignments.fireDamage') };
      case 'mold': return { Icon: Sprout, label: t('dashboard.assignments.mold') };
      default: return { Icon: Wrench, label: t('dashboard.assignments.other') };
    }
  };

  const minutesUntil = focus ? toMinutes(focus.fromTime) - nowMinutes : 0;
  const bannerLead = focusIsNow
    ? (isDa ? `Nu · til ${focus?.toTime?.slice(0, 5)}` : `Now · until ${focus?.toTime?.slice(0, 5)}`)
    : focusIsAhead
      ? `${isDa ? 'Næste' : 'Next'} · ${focus?.fromTime?.slice(0, 5)}${minutesUntil <= 120 ? (isDa ? ` · om ${minutesUntil} min` : ` · in ${minutesUntil} min`) : ''}`
      : (isDa ? 'Dagens sidste opgave' : "Today's last task");

  return (
    <section aria-labelledby="mindag-title" className="space-y-3">
      {focus && (
        <div role="status" className="facet-next-banner flex items-center gap-3 rounded-[22px] px-3.5 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/55" aria-hidden>
            <Navigation className="h-[18px] w-[18px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            {focusDrive ? (
              <>
                <span className="truncate text-xs font-medium opacity-80">{bannerLead} · {focus.location || focus.title}</span>
                <span className="truncate font-display text-base font-bold">{formatDrive(focusDrive, isDa)}</span>
              </>
            ) : (
              <>
                <span className="text-xs font-medium opacity-80">{bannerLead}</span>
                <span className="truncate font-display text-base font-bold">{focus.location || focus.title}</span>
              </>
            )}
          </span>
          {focus.case_number && <span className="ml-auto shrink-0 font-mono text-xs font-medium">#{focus.case_number}</span>}
        </div>
      )}

      <header className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{headerDate}</p>
          <h2 id="mindag-title" className="font-display text-[2rem] font-bold leading-tight tracking-tight text-foreground">
            {isDa ? 'Min Dag' : 'My Day'}
          </h2>
        </div>
        {todayAssignments.length > 0 && (
          <span className="pb-1 text-sm text-muted-foreground tabular-nums">
            {visibleIndex + 1} {isDa ? 'af' : 'of'} {todayAssignments.length}
          </span>
        )}
      </header>

      {isOfflineMode && (
        <div className="flex items-center gap-2 rounded-card border border-border/60 bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <CloudOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            {isDa ? 'Offline (kældertilstand)' : 'Offline (basement mode)'} · {isDa ? 'Viser opgaver gemt kl.' : 'Showing tasks saved at'}{' '}
            {format(new Date(snapshot!.savedAt), 'HH:mm')}
          </span>
        </div>
      )}

      {loading && !isOfflineMode && todayAssignments.length === 0 ? (
        <ListSkeleton variant="card" rowCount={2} />
      ) : error && !isOfflineMode && todayAssignments.length === 0 ? (
        <ErrorState onRetry={handleRetry} retrying={retrying} />
      ) : todayAssignments.length === 0 ? (
        <div className="facet-card px-4 py-10 text-center">
          <CalendarCheck className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {isDa ? 'Ingen opgaver i dag' : 'No tasks today'}
          </p>
          {nextAssignment && (
            <button
              type="button"
              onClick={() => openDetails(nextAssignment)}
              className="mt-2 text-sm font-semibold text-primary-strong underline-offset-2 hover:underline"
            >
              {isDa ? 'Næste opgave' : 'Next task'}:{' '}
              {format(parseISO(nextAssignment.date), 'EEEE d. MMM', { locale: isDa ? daLocale : undefined })}{' '}
              {nextAssignment.fromTime?.slice(0, 5)}
            </button>
          )}
        </div>
      ) : (
        <>
          <ol
            ref={deckRef}
            onScroll={onDeckScroll}
            aria-label={isDa ? 'Dagens opgaver' : "Today's tasks"}
            className="facet-deck -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 pt-1 sm:-mx-6 sm:px-6"
          >
            {todayAssignments.map((assignment, i) => {
              const start = toMinutes(assignment.fromTime);
              const end = toMinutes(assignment.toTime);
              const isCurrent = nowMinutes >= start && nowMinutes <= end;
              const isPast = nowMinutes > end;
              const carNames = getCarNames(assignment);
              const colleagues = getColleagues(assignment);
              const responsible = getResponsible(assignment);
              const warehouseCount = getWarehouseCount(assignment);
              const address = buildFullAddress(assignment);
              const { Icon: TypeIcon, label: typeLabel } = typeInfo(assignment.type);

              return (
                <li
                  key={assignment.id}
                  aria-label={`${i + 1} ${isDa ? 'af' : 'of'} ${todayAssignments.length}`}
                  className="w-[88%] max-w-[440px] shrink-0 snap-center sm:w-[420px]"
                >
                  <article
                    onClick={() => openDetails(assignment)}
                    className={cn('facet-task-card flex h-full cursor-pointer flex-col overflow-hidden rounded-[26px]', isCurrent && 'is-now', isPast && 'opacity-60')}
                  >
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openDetails(assignment); }}
                      className="facet-task-hero relative block w-full px-[18px] pb-4 pt-[18px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-2">
                        <span className="facet-chip"><TypeIcon className="h-4 w-4" aria-hidden /></span>
                        <span className="text-xs font-bold uppercase tracking-[0.04em]">{typeLabel}</span>
                        {isCurrent && <span className="facet-today-badge">{t('ui.inProgressNow')}</span>}
                        <CaseNumber value={assignment.case_number} className="ml-auto font-mono text-xs" />
                      </span>
                      <span className="mt-3 block font-mono text-[15px] font-medium tabular-nums">
                        {assignment.fromTime?.slice(0, 5)}–{assignment.toTime?.slice(0, 5)}
                      </span>
                      <span className="mt-0.5 flex items-start gap-2">
                        <span className="font-display text-2xl font-bold leading-[1.2] tracking-tight break-words">{assignment.title}</span>
                        <ChevronRight className="mt-1.5 h-5 w-5 shrink-0 opacity-50" aria-hidden />
                      </span>
                    </button>

                    <dl className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-2.5 gap-y-3 px-[18px] py-4 text-[15px] leading-snug">
                      {address && (
                        <>
                          <dt className="pt-0.5 text-muted-foreground"><MapPin className="h-[18px] w-[18px]" aria-hidden /><span className="sr-only">{isDa ? 'Adresse' : 'Address'}</span></dt>
                          <dd className="font-semibold text-foreground">
                            {address}
                            {drives.get(assignment.id) && !isPast && (
                              <span className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
                                {formatDrive(drives.get(assignment.id)!, isDa)}{drives.get(assignment.id)!.durationMin > 0 && (isDa ? ' fra forrige' : ' from previous')}
                              </span>
                            )}
                          </dd>
                        </>
                      )}
                      {(colleagues.length > 0 || carNames.length > 0) && (
                        <>
                          <dt className="pt-0.5 text-muted-foreground"><Users className="h-[18px] w-[18px]" aria-hidden /><span className="sr-only">{isDa ? 'Med' : 'With'}</span></dt>
                          <dd className="text-foreground">
                            {colleagues.length > 0 && <>{isDa ? 'Med' : 'With'} {colleagues.join(', ')}</>}
                            {colleagues.length > 0 && carNames.length > 0 && ' · '}
                            {carNames.length > 0 && <span className="inline-flex items-center gap-1 font-mono text-sm"><CarIcon className="h-3.5 w-3.5" aria-hidden />{carNames.join(', ')}</span>}
                          </dd>
                        </>
                      )}
                      {responsible?.name && (
                        <>
                          <dt className="pt-0.5 text-muted-foreground"><UserRound className="h-[18px] w-[18px]" aria-hidden /><span className="sr-only">{isDa ? 'Ansvarlig' : 'Responsible'}</span></dt>
                          <dd className="text-muted-foreground">{isDa ? 'Ansvarlig' : 'Responsible'}: <span className="font-medium text-foreground">{responsible.name}</span></dd>
                        </>
                      )}
                      {warehouseCount > 0 && (
                        <>
                          <dt className="pt-0.5 text-warning-soft-foreground"><Package className="h-[18px] w-[18px]" aria-hidden /><span className="sr-only">{isDa ? 'Lager' : 'Warehouse'}</span></dt>
                          <dd><span className="inline-flex items-center rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning-soft-foreground tabular-nums">{warehouseCount} {isDa ? 'på lager' : 'in storage'}</span></dd>
                        </>
                      )}
                    </dl>

                    {assignment.description && (
                      <p className="mx-[18px] mb-4 line-clamp-3 rounded-[14px] bg-muted/70 px-3 py-2.5 text-[13px] text-muted-foreground">{assignment.description}</p>
                    )}

                    <div className="mt-auto flex gap-2 px-3.5 pb-3.5">
                      {address && (
                        <Button
                          className="facet-field-btn flex-[1.3]"
                          onClick={e => { e.stopPropagation(); handleNavigate(assignment); }}
                        >
                          <Navigation className="h-5 w-5" aria-hidden />
                          {isDa ? 'Naviger' : 'Navigate'}
                        </Button>
                      )}
                      {responsible?.phone && responsible.id !== user?.id && (
                        <Button variant="secondary" asChild className="facet-field-btn flex-1">
                          <a href={`tel:${responsible.phone.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()} aria-label={`${isDa ? 'Ring til' : 'Call'} ${responsible.name}`}>
                            <Phone className="h-5 w-5" aria-hidden />
                            {isDa ? 'Ring' : 'Call'}
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="facet-field-btn flex-1"
                        aria-label={isDa ? 'SMS: På vej' : 'SMS: On my way'}
                        onClick={e => {
                          e.stopPropagation();
                          setSmsCaseNumber(assignment.case_number ?? null);
                          setIsSmsOpen(true);
                        }}
                      >
                        <MessageSquare className="h-5 w-5" aria-hidden />
                        {isDa ? 'På vej' : 'On my way'}
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

          {todayAssignments.length > 1 && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5" role="group" aria-label={isDa ? 'Gå til opgave' : 'Go to task'}>
                {todayAssignments.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => scrollToCard(i)}
                    aria-label={`${i + 1}: ${a.fromTime?.slice(0, 5) ?? ''} ${a.title}`}
                    aria-current={i === visibleIndex ? 'true' : undefined}
                    className="flex h-6 min-w-6 items-center justify-center"
                  >
                    <span className={cn('block h-1.5 rounded-full transition-all duration-200 ease-facet', i === visibleIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/35')} />
                  </button>
                ))}
              </div>
              {upNext && (
                <p className="text-center text-xs text-muted-foreground">
                  {isDa ? 'Swipe til næste' : 'Swipe for next'} · <span className="font-mono">{upNext.fromTime?.slice(0, 5)}</span> {upNext.title}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {isDialogOpen && selectedAssignment && (
        <Suspense fallback={null}>
          <AssignmentDetailsDialog
            assignment={selectedAssignment}
            cars={cars}

            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedAssignment(null);
            }}
          />
        </Suspense>
      )}

      {isSmsOpen && (
        <Suspense fallback={null}>
          <OnMyWaySmsDialog
            isOpen={isSmsOpen}
            onClose={() => setIsSmsOpen(false)}
            caseNumber={smsCaseNumber}
            senderFirstName={user?.name?.split(' ')[0] ?? ''}
            isDa={isDa}
          />
        </Suspense>
      )}
    </section>
  );
};

export default React.memo(MinDag);
