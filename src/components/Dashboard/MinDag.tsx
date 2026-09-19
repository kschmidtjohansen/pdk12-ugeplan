import React, { useMemo, useState, Suspense, lazy } from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, Clock, MapPin, Car as CarIcon, Users, Package, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useCars } from '@/hooks/car';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouseIndicators } from '@/hooks/warehouse/useWarehouseIndicators';
import ListSkeleton from '@/components/shared/ListSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { Assignment } from '@/types/assignment';

const AssignmentDetailsDialog = lazy(() => import('./AssignmentDetailsDialog'));

const toMinutes = (time?: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

const buildFullAddress = (assignment: Assignment): string =>
  [assignment.location, assignment.zip_code, assignment.city].filter(Boolean).join(', ');

const MinDag: React.FC = () => {
  const { user } = useAuth();
  const { currentLanguage } = useTranslation();
  const isDa = currentLanguage === 'da';
  const { assignments, loading, error, fetchAssignments } = useAssignmentDataOptimized();
  const { cars } = useCars();
  const { employees } = useEmployees();
  const { data: warehouseIndicators } = useWarehouseIndicators();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

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

  const todayAssignments = useMemo(
    () =>
      myAssignments
        .filter(a => a.date === todayStr)
        .sort((a, b) => toMinutes(a.fromTime) - toMinutes(b.fromTime)),
    [myAssignments, todayStr]
  );

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
      phone: employee?.phone || '',
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
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleRetry = async () => {
    setRetrying(true);
    await fetchAssignments();
    setRetrying(false);
  };

  const headerDate = format(new Date(), 'EEEE d. MMMM', { locale: isDa ? daLocale : undefined });
  const firstStart = todayAssignments[0]?.fromTime?.slice(0, 5);

  return (
    <Card>
      <CardHeader className="brand-card-header flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold brand-dot capitalize">
          {isDa ? 'Min dag' : 'My day'} — {headerDate}
        </CardTitle>
        <div className="flex items-center gap-2">
          {firstStart && (
            <Badge variant="secondary" className="tabular-nums">
              {isDa ? 'Start' : 'Start'} {firstStart}
            </Badge>
          )}
          <Badge variant="secondary" className="tabular-nums">
            {todayAssignments.length} {isDa ? (todayAssignments.length === 1 ? 'opgave' : 'opgaver') : 'tasks'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && todayAssignments.length === 0 ? (
          <ListSkeleton variant="card" rowCount={2} />
        ) : error && todayAssignments.length === 0 ? (
          <ErrorState onRetry={handleRetry} retrying={retrying} />
        ) : todayAssignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/50 px-4 py-8 text-center">
            <CalendarCheck className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {isDa ? 'Ingen opgaver i dag' : 'No tasks today'}
            </p>
            {nextAssignment && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAssignment(nextAssignment);
                  setIsDialogOpen(true);
                }}
                className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                {isDa ? 'Næste opgave' : 'Next task'}:{' '}
                {format(parseISO(nextAssignment.date), 'EEEE d. MMM', { locale: isDa ? daLocale : undefined })}{' '}
                {nextAssignment.fromTime?.slice(0, 5)}
              </button>
            )}
          </div>
        ) : (
          todayAssignments.map(assignment => {
            const start = toMinutes(assignment.fromTime);
            const end = toMinutes(assignment.toTime);
            const isCurrent = nowMinutes >= start && nowMinutes <= end;
            const isPast = nowMinutes > end;
            const carNames = getCarNames(assignment);
            const colleagues = getColleagues(assignment);
            const responsible = getResponsible(assignment);
            const warehouseCount = getWarehouseCount(assignment);
            const address = buildFullAddress(assignment);

            return (
              <div
                key={assignment.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setIsDialogOpen(true);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAssignment(assignment);
                    setIsDialogOpen(true);
                  }
                }}
                className={`cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40 ${
                  isCurrent ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'
                } ${isPast ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-base font-semibold tabular-nums">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {assignment.fromTime?.slice(0, 5)} – {assignment.toTime?.slice(0, 5)}
                      {isCurrent && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {isDa ? 'I gang nu' : 'In progress'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-base font-medium">{assignment.title}</p>
                    {assignment.case_number && (
                      <p className="text-xs text-muted-foreground">{assignment.case_number}</p>
                    )}
                  </div>
                  {warehouseCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning-soft-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{warehouseCount}</span>
                    </span>
                  )}
                </div>

                {address && (
                  <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{address}</span>
                  </p>
                )}

                {responsible?.name && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isDa ? 'Ansvarlig' : 'Responsible'}:{' '}
                    <span className="font-medium text-foreground">{responsible.name}</span>
                  </p>
                )}

                {colleagues.length > 0 && (
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <Users className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{colleagues.join(', ')}</span>
                  </p>
                )}

                {carNames.length > 0 && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <CarIcon className="h-4 w-4 shrink-0" />
                    <span>{carNames.join(', ')}</span>
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {address && (
                    <Button
                      size="sm"
                      variant="brand"
                      className="min-h-11 flex-1 sm:flex-none"
                      onClick={e => {
                        e.stopPropagation();
                        handleNavigate(assignment);
                      }}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {isDa ? 'Kør dertil' : 'Navigate'}
                    </Button>
                  )}
                  {responsible?.phone && responsible.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="min-h-11 flex-1 sm:flex-none"
                    >
                      <a
                        href={`tel:${responsible.phone.replace(/\s/g, '')}`}
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        {isDa ? 'Ring' : 'Call'} {responsible.name.split(' ')[0]}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

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
    </Card>
  );
};

export default React.memo(MinDag);
