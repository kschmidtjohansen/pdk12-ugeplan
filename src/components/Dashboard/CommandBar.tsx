import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Phone, Users, Car, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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

const greet = (h: number) =>
  h >= 5 && h < 10 ? 'Godmorgen' : h < 12 && h >= 10 ? 'God formiddag' : h >= 12 && h < 17 ? 'God eftermiddag' : 'Godaften';

interface CommandBarProps {
  userName?: string;
  actions?: React.ReactNode;
}

const CommandBar: React.FC<CommandBarProps> = ({ userName, actions }) => {
  const navigate = useNavigate();
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
    const name = d.employee?.name || emp?.name || (d.notes?.startsWith('EKSTERN:') ? d.notes.split('\n')[0].replace('EKSTERN: ', '') : 'Ukendt');
    return { id: d.id, type: d.duty_type === 'skadeleder_vagt' ? 'Skadeledervagt' : 'Kørevagt', name, phone: emp?.phone };
  });
  const leaderDuties = dutyPeople.filter(d => d.type === 'Skadeledervagt');
  const driveDuties = dutyPeople.filter(d => d.type === 'Kørevagt');
  const names = (list: typeof dutyPeople) => list.map(d => d.name.split(' ')[0]).join(', ');
  const upcomingDuties = useMemo(() => duties
    .filter(d => d.duty_date > todayStr)
    .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
    .map(d => ({
      id: d.id,
      type: d.duty_type === 'skadeleder_vagt' ? 'Skadeledervagt' : 'Kørevagt',
      name: d.employee?.name || employees.find(e => e.id === d.employee_id)?.name || 'Ekstern',
      date: format(new Date(d.duty_date + 'T00:00:00'), 'EEE d/M', { locale: da }),
    })), [duties, employees, todayStr]);

  const expiring = useMemo(() => employees.filter(isTempExpiringSoon), [employees]);
  const firstName = userName?.split(' ')[0] ?? '';
  const [panel, setPanel] = useState<null | 'duty' | 'emp' | 'car' | 'temp'>(null);

  const todayAssignments = useMemo(() => (assignments ?? []).filter((a: any) => a.date === todayStr), [assignments, todayStr]);
  const availEmpIds = new Set(metrics.availableEmployees.employees.map((e: any) => e.id));
  const busyEmployees = useMemo(() => {
    const out: { id: string; name: string; phone?: string | null; task: string }[] = [];
    todayAssignments.forEach((a: any) => (a.assignedEmployees ?? []).forEach((e: any) => {
      if (availEmpIds.has(e.id) || out.some(o => o.id === e.id)) return;
      const full = employees.find(x => x.id === e.id);
      out.push({ id: e.id, name: e.name, phone: full?.phone, task: `${a.fromTime?.slice(0, 5) ?? ''} ${a.title ?? ''}`.trim() });
    }));
    return out;
  }, [todayAssignments, employees, metrics.availableEmployees.employees]);
  const availCarIds = new Set(metrics.availableCars.cars.map((c: any) => c.id));
  const busyCars = useMemo(() => {
    const out: { id: string; name: string; by?: string }[] = [];
    todayAssignments.forEach((a: any) => {
      const ids: string[] = a.cars?.length ? a.cars : typeof a.car === 'string' ? [a.car] : a.car?.id ? [a.car.id] : [];
      ids.forEach(id => {
        if (availCarIds.has(id) || out.some(o => o.id === id)) return;
        out.push({ id, name: a.car?.name ?? 'Bil', by: (a.assignedEmployees ?? []).map((e: any) => e.name.split(' ')[0]).join(', ') || a.title });
      });
    });
    return out;
  }, [todayAssignments, metrics.availableCars.cars]);

  return (
    <section className="rounded-xl border border-border/60 bg-card/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60 animate-fade-in sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {greet(now.getHours())}{firstName && `, ${firstName}`}
            </h1>
            <p className="text-xs capitalize text-muted-foreground">
              <span className="sm:hidden">{format(now, "EEE d. MMM · 'uge' I", { locale: da })}</span>
              <span className="hidden sm:inline">{format(now, "EEEE d. MMMM · 'uge' I", { locale: da })}</span>
            </p>
            <p className="mt-0.5 truncate text-xs italic text-muted-foreground/80 sm:line-clamp-2 sm:whitespace-normal">
              {getDailyQuote()}
            </p>
          </div>
          <div className="flex items-center gap-1 lg:hidden">{actions}</div>
        </div>
        <div className="flex items-center gap-2 lg:w-[420px]">
          <GlobalSearch />
          <div className="hidden items-center gap-1 lg:flex">{actions}</div>
        </div>
      </div>

      <div className="relative mt-3">
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-0.5 pr-6 [scrollbar-width:none] sm:pr-1">
          <StatusPill className="snap-start" icon={Phone} tone="primary" label={mainDuty ? `Vagt: ${mainDuty.name}` : 'Ingen vagt i dag'} onClick={() => setPanel('duty')} />
          <StatusPill className="snap-start" icon={Users} label={`${metrics.availableEmployees.count}/${metrics.availableEmployees.total} ledige`} onClick={() => setPanel('emp')} />
          <StatusPill className="snap-start" icon={Car} label={`${metrics.availableCars.count}/${metrics.availableCars.total} biler`} onClick={() => setPanel('car')} />
          {expiring.length > 0 && (
            <StatusPill className="snap-start" icon={Clock} tone="warning" label={`${expiring.length} ${expiring.length === 1 ? 'vikar udløber' : 'vikarer udløber'}`} onClick={() => setPanel('temp')} />
          )}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden" />
      </div>

      <StatusDetailSheet open={panel === 'duty'} onOpenChange={o => !o && setPanel(null)} title="Vagt" description="Dagens vagthavende">
        <DutyDetailPanel today={dutyPeople} upcoming={upcomingDuties} onOpenPlan={() => { setPanel(null); navigate('/duty'); }} />
      </StatusDetailSheet>
      <StatusDetailSheet open={panel === 'emp'} onOpenChange={o => !o && setPanel(null)} title="Medarbejdere i dag">
        <AvailableEmployeesPanel available={metrics.availableEmployees.employees as any} busy={busyEmployees} onShowAll={() => { setPanel(null); setEmpOpen(true); }} />
      </StatusDetailSheet>
      <StatusDetailSheet open={panel === 'car'} onOpenChange={o => !o && setPanel(null)} title="Biler i dag">
        <AvailableCarsPanel
          available={metrics.availableCars.cars.map((c: any) => ({ id: c.id, name: c.name, plate: c.number_plate }))}
          busy={busyCars}
          onShowAll={() => { setPanel(null); setCarOpen(true); }}
        />
      </StatusDetailSheet>
      <StatusDetailSheet open={panel === 'temp'} onOpenChange={o => !o && setPanel(null)} title="Vikarer der udløber">
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
        title="Ledige medarbejdere"
      />
      <CarAvailabilityModal
        isOpen={carOpen}
        onClose={() => setCarOpen(false)}
        cars={metrics.availableCars.cars}
        title="Ledige biler"
        selectedDate={todayStr}
      />
    </section>
  );
};

export default CommandBar;
