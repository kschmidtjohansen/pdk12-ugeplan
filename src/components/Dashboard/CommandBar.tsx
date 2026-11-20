import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { Clock, Quote } from 'lucide-react';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useEmployees } from '@/hooks/useEmployees';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { isTempExpiringSoon, getTempDaysLeft, expiryLabel } from '@/utils/tempExpiry';
import { getDailyQuote } from '@/utils/dailyQuotes';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import CarAvailabilityModal from './CarAvailabilityModal';
import GlobalSearch from './GlobalSearch';
import StatusPill from './StatusPill';
import StatusDetailSheet from './StatusDetailSheet';
import { DutyDetailPanel, AvailableEmployeesPanel, AvailableCarsPanel, ExpiringTempsPanel } from './StatusPanels';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { usePermissions } from '@/context/AuthContext';
import { getAssignmentEmployeeIds } from '@/utils/assignmentConflicts';
import { cn } from '@/lib/utils';

/** Lærredets nøgletal under hilsenen: stort tal, kort forklaring, klik åbner detaljer. */
const KpiStat: React.FC<{ label: string; value: React.ReactNode; sub?: string; onClick?: () => void; tone?: 'warning' }> = ({ label, value, sub, onClick, tone }) => {
  const body = (
    <>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      <span className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground tabular-nums">{value}</span>
      {sub && <span className={cn('truncate text-xs', tone === 'warning' ? 'font-semibold text-warning-soft-foreground' : 'text-muted-foreground')}>{sub}</span>}
    </>
  );
  return onClick
    ? <button type="button" onClick={onClick} className="flex min-w-0 flex-col items-start gap-0.5 rounded-card px-3 py-2 text-left transition-colors duration-140 ease-facet hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</button>
    : <div className="flex min-w-0 flex-col items-start gap-0.5 px-3 py-2">{body}</div>;
};

const greetKey = (h: number) =>
  h >= 5 && h < 10 ? 'ui.goodMorning' : h < 12 && h >= 10 ? 'ui.goodForenoon' : h >= 12 && h < 17 ? 'ui.goodAfternoon' : 'ui.goodEvening';

interface CommandBarProps {
  userName?: string;
  actions?: React.ReactNode;
}

const CommandBar: React.FC<CommandBarProps> = ({ userName, actions }) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const dateLocale = useDateLocale();
  const now = useMemo(() => new Date(), []);
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }), [now]);
  const { duties } = useDutyData(weekStart, weekEnd);
  const { employees } = useEmployees();
  const { metrics, assignments, vacations } = useDashboardMetrics(todayStr);
  const [empOpen, setEmpOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);

  const todayDuties = useMemo(() => duties.filter(d => d.duty_date === todayStr), [duties, todayStr]);
  const dutyPeople = todayDuties.map(d => {
    const emp = employees.find(e => e.id === d.employee_id);
    const name = d.employee?.name || emp?.name || (d.notes?.startsWith('EKSTERN:') ? d.notes.split('\n')[0].replace('EKSTERN: ', '') : t('ui.unknown'));
    return { id: d.id, type: d.duty_type === 'skadeleder_vagt' ? 'skadeleder' : 'drive', name, phone: emp?.phone };
  });
  const leaderDuties = dutyPeople.filter(d => d.type === 'skadeleder');
  const driveDuties = dutyPeople.filter(d => d.type === 'drive');
  const names = (list: typeof dutyPeople) => list.map(d => d.name.split(' ')[0]).join(', ');
  const upcomingDuties = useMemo(() => duties
    .filter(d => d.duty_date > todayStr)
    .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
    .map(d => ({
      id: d.id,
      type: d.duty_type === 'skadeleder_vagt' ? t('ui.dutyLeader') : t('ui.drivingDuty'),
      name: d.employee?.name || employees.find(e => e.id === d.employee_id)?.name || t('ui.external'),
      date: format(new Date(d.duty_date + 'T00:00:00'), 'EEE d/M', { locale: dateLocale }),
    })), [duties, employees, todayStr, t]);

  const expiring = useMemo(() => employees.filter(isTempExpiringSoon), [employees]);
  const firstName = userName?.split(' ')[0] ?? '';
  const [panel, setPanel] = useState<null | 'duty' | 'emp' | 'car' | 'temp'>(null);

  const todayAssignments = useMemo(() => (assignments ?? []).filter((a: Assignment) => a.date === todayStr), [assignments, todayStr]);
  const availEmpIds = new Set(metrics.availableEmployees.employees.map((e: { id: string }) => e.id));
  const busyEmployees = useMemo(() => {
    const out: { id: string; name: string; phone?: string | null; task: string }[] = [];
    todayAssignments.forEach((a: Assignment) => (a.assignedEmployees ?? []).forEach((e) => {
      if (availEmpIds.has(e.id) || out.some(o => o.id === e.id)) return;
      const full = employees.find(x => x.id === e.id);
      out.push({ id: e.id, name: e.name, phone: full?.phone, task: `${a.fromTime?.slice(0, 5) ?? ''} ${a.title ?? ''}`.trim() });
    }));
    return out;
  }, [todayAssignments, employees, metrics.availableEmployees.employees]);
  const availCarIds = new Set(metrics.availableCars.cars.map((c: { id: string }) => c.id));
  const busyCars = useMemo(() => {
    const out: { id: string; name: string; by?: string }[] = [];
    todayAssignments.forEach((a: Assignment) => {
      const ids: string[] = a.cars?.length ? a.cars : typeof a.car === 'string' ? [a.car] : a.car?.id ? [a.car.id] : [];
      ids.forEach(id => {
        if (availCarIds.has(id) || out.some(o => o.id === id)) return;
        const carName = typeof a.car === 'object' ? a.car?.name : undefined;
        out.push({ id, name: carName ?? 'Bil', by: (a.assignedEmployees ?? []).map((e) => e.name.split(' ')[0]).join(', ') || a.title });
      });
    });
    return out;
  }, [todayAssignments, metrics.availableCars.cars]);

  const { isAdmin, isSkadeleder } = usePermissions();
  const noCrew = todayAssignments.filter((a: Assignment) => getAssignmentEmployeeIds(a).length === 0).length;
  const absent = metrics.absentEmployees.employees as Array<{ vacation?: unknown; onTraining?: boolean; isSick?: boolean }>;
  const sick = absent.filter(e => e.isSick).length, onVac = absent.filter(e => !e.isSick && e.vacation).length, onTraining = absent.filter(e => !e.isSick && !e.vacation && e.onTraining).length;
  const otherAbs = absent.length - sick - onVac - onTraining;
  const canSeeSick = isAdmin || isSkadeleder;
  const absentParts = [
    sick && (canSeeSick ? `${sick} ${sick === 1 ? 'syg' : 'syge'}` : null),
    onVac && `${onVac} ferie`, onTraining && `${onTraining} kursus`,
    (otherAbs + (canSeeSick ? 0 : sick)) > 0 && `${otherAbs + (canSeeSick ? 0 : sick)} andet`,
  ].filter(Boolean).join(', ');
  const dutyCount = leaderDuties.length + driveDuties.length;
  const dutySub = [leaderDuties.length && `${t('ui.caseManager')}: ${names(leaderDuties)}`, driveDuties.length && `${driveDuties.length > 1 ? t('ui.drivingDuties') : t('ui.drivingDuty')}: ${names(driveDuties)}`].filter(Boolean).join(' · ');
  const da = currentLanguage === 'da';

  const hour = now.getHours();
  const tid = hour < 10 ? 'morgen' : hour < 17 ? 'dag' : 'aften';
  const placeCount = useMemo(
    () => new Set(todayAssignments.map((a: Assignment) => [a.location, a.city].filter(Boolean).join(', ').trim().toLowerCase()).filter(Boolean)).size,
    [todayAssignments],
  );
  const taskCount = todayAssignments.length;
  const summary = taskCount === 0
    ? t('ui.daySummaryNone')
    : t('ui.daySummary', {
        tasks: taskCount === 1 ? t('ui.dayTasksOne') : t('ui.dayTasksMany', { count: taskCount }),
        places: placeCount === 1 ? t('ui.dayPlacesOne') : t('ui.dayPlacesMany', { count: placeCount }),
      });

  return (
    <section aria-labelledby="dagslys-title" data-tid={tid} className="facet-dagslys facet-glow -mx-3 -mt-3 px-3 pb-3 pt-4 sm:-mx-6 sm:-mt-4 sm:px-6 sm:pt-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(240px,380px)] xl:items-start">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              <span className="sm:hidden">{format(now, "EEE d. MMM · 'uge' I", { locale: dateLocale })}</span>
              <span className="hidden sm:inline">{format(now, "EEEE d. MMMM · 'uge' I", { locale: dateLocale })}</span>
            </p>
            <h1 id="dagslys-title" className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-foreground break-words sm:text-[2.5rem] sm:leading-[1.15]">
              {t(greetKey(hour))}{firstName && `, ${firstName}`}
            </h1>
            <p className="text-sm text-foreground/80 sm:text-base">{summary}</p>
          </div>
          <div className="hidden flex-wrap items-center gap-1 sm:flex xl:hidden">{actions}</div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <GlobalSearch />
          <div className="hidden items-center gap-1 xl:flex">{actions}</div>
        </div>
        <div className="flex items-center gap-1 sm:hidden">{actions}</div>
      </div>

      <figure className="mt-3 flex sm:mt-4 max-w-3xl items-start gap-2 text-sm text-muted-foreground">
        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <blockquote className="italic"><span className="sr-only">{t('ui.dailyQuote')}: </span>{getDailyQuote()}</blockquote>
      </figure>

      <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1 sm:mt-5 lg:grid-cols-4">
        <KpiStat label={da ? 'Opgaver i dag' : 'Tasks today'} value={taskCount} sub={noCrew ? (da ? `${noCrew} mangler hold` : `${noCrew} need a crew`) : (da ? `${placeCount} adresser` : `${placeCount} addresses`)} tone={noCrew ? 'warning' : undefined} onClick={() => navigate('/planner')} />
        <KpiStat label={da ? 'Vagter i dag' : 'Duties today'} value={dutyCount} sub={dutyCount ? dutySub : t('ui.noDutyToday')} onClick={() => setPanel('duty')} />
        <KpiStat label={da ? 'Fraværende' : 'Absent'} value={metrics.absentEmployees.count} sub={absentParts || (da ? 'Alle er på arbejde' : 'Everyone is in')} onClick={() => setPanel('emp')} />
        <KpiStat label={da ? 'Ledige biler' : 'Free cars'} value={<>{metrics.availableCars.count}<span className="text-xl text-muted-foreground">/{metrics.availableCars.total}</span></>} sub={da ? `${metrics.availableEmployees.count}/${metrics.availableEmployees.total} medarbejdere ledige` : `${metrics.availableEmployees.count}/${metrics.availableEmployees.total} people free`} onClick={() => setPanel('car')} />
      </div>
      {expiring.length > 0 && (
        <div className="mt-2 px-3">
          <StatusPill icon={Clock} tone="warning" label={`${expiring.length} ${expiring.length === 1 ? t('ui.tempExpiringOne') : t('ui.tempExpiringMany')}`} onClick={() => setPanel('temp')} />
        </div>
      )}

      <StatusDetailSheet open={panel === 'duty'} onOpenChange={o => !o && setPanel(null)} title={t('ui.duty')} description={t('ui.todaysOnCall')}>
        <DutyDetailPanel today={dutyPeople} upcoming={upcomingDuties} onOpenPlan={() => { setPanel(null); navigate('/duty'); }} />
      </StatusDetailSheet>
      <StatusDetailSheet open={panel === 'emp'} onOpenChange={o => !o && setPanel(null)} title={t('ui.employeesToday')}>
        <AvailableEmployeesPanel available={metrics.availableEmployees.employees} busy={busyEmployees} onShowAll={() => { setPanel(null); setEmpOpen(true); }} />
      </StatusDetailSheet>
      <StatusDetailSheet open={panel === 'car'} onOpenChange={o => !o && setPanel(null)} title={t('ui.carsToday')}>
        <AvailableCarsPanel
          available={metrics.availableCars.cars.map((c) => ({ id: c.id, name: c.name, plate: c.number_plate }))}
          busy={busyCars}
          onShowAll={() => { setPanel(null); setCarOpen(true); }}
        />
      </StatusDetailSheet>
      <StatusDetailSheet open={panel === 'temp'} onOpenChange={o => !o && setPanel(null)} title={t('ui.tempExpiringTitle')}>
        <ExpiringTempsPanel
          items={expiring.map(e => ({ id: e.id, name: e.name, label: expiryLabel(getTempDaysLeft(e) ?? 0, true) }))}
          onExtend={() => { setPanel(null); navigate('/employees'); }}
        />
      </StatusDetailSheet>

      <EmployeeAvailabilityDialog
        open={empOpen}
        onOpenChange={setEmpOpen}
        employees={metrics.availableEmployees.employees}
        selectedDate={todayStr}
        assignments={assignments}
        vacations={vacations}
        title={t('ui.availableEmployees')}
      />
      <CarAvailabilityModal
        isOpen={carOpen}
        onClose={() => setCarOpen(false)}
        cars={metrics.availableCars.cars}
        title={t('ui.availableCars')}
        selectedDate={todayStr}
      />
    </section>
  );
};

export default CommandBar;
