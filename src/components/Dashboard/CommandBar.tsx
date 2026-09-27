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
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import CarAvailabilityModal from './CarAvailabilityModal';
import GlobalSearch from './GlobalSearch';
import StatusPill from './StatusPill';

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
  const mainDuty = dutyPeople.find(d => d.type === 'Skadeledervagt') ?? dutyPeople[0];

  const expiring = useMemo(() => employees.filter(isTempExpiringSoon), [employees]);
  const firstName = userName?.split(' ')[0] ?? '';

  return (
    <section className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {greet(now.getHours())}{firstName && `, ${firstName}`}
            </h1>
            <p className="text-xs capitalize text-muted-foreground">
              {format(now, "EEEE d. MMMM · 'uge' I", { locale: da })}
            </p>
          </div>
          <div className="flex items-center gap-1 lg:hidden">{actions}</div>
        </div>
        <div className="flex items-center gap-2 lg:w-[420px]">
          <GlobalSearch />
          <div className="hidden items-center gap-1 lg:flex">{actions}</div>
        </div>
      </div>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
        <Popover>
          <PopoverTrigger asChild>
            <StatusPill icon={Phone} tone="primary" label={mainDuty ? `Vagt: ${mainDuty.name}` : 'Ingen vagt i dag'} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            {dutyPeople.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen vagter i dag.</p>
            ) : (
              <div className="space-y-3">
                {dutyPeople.map(d => (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{d.type}</p>
                      <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                      {d.phone && <p className="text-xs tabular-nums text-muted-foreground">{d.phone}</p>}
                    </div>
                    {d.phone && (
                      <Button size="sm" variant="brand" asChild>
                        <a href={`tel:${d.phone.replace(/\s/g, '')}`}><Phone className="mr-1 h-3.5 w-3.5" />Ring</a>
                      </Button>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="w-full" onClick={() => navigate('/duty')}>Åbn vagtplan</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <StatusPill icon={Users} label={`${metrics.availableEmployees.count}/${metrics.availableEmployees.total} ledige`} onClick={() => setEmpOpen(true)} />
        <StatusPill icon={Car} label={`${metrics.availableCars.count}/${metrics.availableCars.total} biler`} onClick={() => setCarOpen(true)} />

        {expiring.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <StatusPill icon={Clock} tone="warning" label={`${expiring.length} ${expiring.length === 1 ? 'vikar udløber' : 'vikarer udløber'}`} />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3 space-y-2">
              {expiring.map(e => (
                <p key={e.id} className="text-sm text-foreground">
                  {e.name} <span className="text-muted-foreground">· {expiryLabel(getTempDaysLeft(e) ?? 0, true).toLowerCase()}</span>
                </p>
              ))}
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/employees')}>Forlæng</Button>
            </PopoverContent>
          </Popover>
        )}
      </div>

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
