import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { CalendarPlus, Droplets, Edit, Forklift, FlaskConical, GraduationCap, HardHat, HeartPulse, Mail, MoreHorizontal, Phone, Plus, Thermometer, Trash2, Truck, UserCheck, UserMinus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types/employee';
import type { Assignment } from '@/types/assignment';
import type { Vacation } from '@/types/vacation';
import { TONE_CHIP, TONE_RING, initials, shortPlace, type TodayStatus } from '@/lib/employeeToday';
import { parseLeaveReason } from '@/components/Vacation/leaveType';

export interface WeekDay { date: string; label: string; count: number; off: boolean; isToday: boolean }

interface Props {
  employee: Employee;
  status: TodayStatus;
  departmentName?: string;
  roleLabel: string;
  today: Assignment[];
  week: WeekDay[];
  upcoming: Assignment[];
  vacations: Vacation[];
  carLabel: (a: Assignment) => string | undefined;
  da: boolean;
  isAdmin: boolean;
  canCreate: boolean;
  canSeeContact: boolean;
  isSick: boolean;
  isOnTraining: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSick?: () => void;
  onTraining?: () => void;
  onToggleLeave?: () => void;
  onClose?: () => void;
}

type Tab = 'overview' | 'tasks' | 'absence' | 'skills';
const t5 = (t?: string) => (t || '').slice(0, 5);

const AssignmentRow: React.FC<{ a: Assignment; car?: string; showDate?: boolean; da: boolean }> = ({ a, car, showDate, da }) => (
  <li className="flex items-start gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
    <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-info-soft text-info-soft-foreground"><Droplets className="h-3.5 w-3.5" /></span>
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold text-foreground">{a.title}</span>
      <span className="block truncate text-xs text-muted-foreground">
        {showDate && `${format(parseISO(a.date), da ? 'EEE d. MMM' : 'EEE d MMM', { locale: da ? daLocale : undefined })} · `}
        {t5(a.fromTime)}–{t5(a.toTime)} · {shortPlace(a.location)}{car ? ` · ${car}` : ''}
      </span>
    </span>
  </li>
);

/** Lærredets detaljepanel for en medarbejder: dagens opgaver, ugen, fravær og kompetencer, med de handlinger listen også har. */
const EmployeeDetailPanel: React.FC<Props> = (p) => {
  const { employee: e, da } = p;
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: da ? 'Oversigt' : 'Overview' },
    { key: 'tasks', label: da ? 'Opgaver' : 'Tasks' },
    { key: 'absence', label: da ? 'Fravær' : 'Absence' },
    { key: 'skills', label: da ? 'Kompetencer' : 'Skills' },
  ];
  const skills = [
    e.has_asbestos_certificate && { icon: HardHat, label: da ? 'Asbestcertifikat' : 'Asbestos certificate' },
    e.has_pcb_certificate && { icon: FlaskConical, label: da ? 'PCB-certifikat' : 'PCB certificate' },
    e.has_trailer_license && { icon: Truck, label: da ? 'Trailerkørekort' : 'Trailer licence' },
    e.has_forklift_license && { icon: Forklift, label: da ? 'Truckcertifikat' : 'Forklift licence' },
  ].filter(Boolean) as { icon: typeof HardHat; label: string }[];
  const dateFmt = (d: string) => format(parseISO(d), 'd. MMM', { locale: da ? daLocale : undefined });

  return (
    <section aria-label={e.name} className="facet-card overflow-hidden">
      <header className="facet-person-head relative flex items-center gap-3 px-5 pb-4 pt-5">
        <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-lg font-bold shadow-flade', TONE_RING[p.status.tone], TONE_CHIP[p.status.tone])}>
          {e.avatar_url ? <img src={e.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(e.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-bold leading-tight text-foreground">{e.name}</h2>
          <p className="truncate text-xs text-muted-foreground">{[e.jobTitle || p.roleLabel, p.departmentName].filter(Boolean).join(' · ')}</p>
          <span className={cn('mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONE_CHIP[p.status.tone])}>{p.status.label}</span>
        </div>
        {p.onClose && <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-9 w-9 rounded-full" onClick={p.onClose} aria-label={da ? 'Luk' : 'Close'}><X className="h-4 w-4" /></Button>}
      </header>

      <div role="tablist" aria-label={e.name} className="flex gap-4 border-b border-border px-5">
        {tabs.map(t => (
          <button key={t.key} role="tab" type="button" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn('-mb-px min-h-11 border-b-2 text-xs font-semibold transition-colors', tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-5 px-5 py-4">
        {tab === 'overview' && (
          <>
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{da ? 'I dag' : 'Today'}</h3>
              {p.today.length
                ? <ul className="space-y-2">{p.today.map(a => <AssignmentRow key={a.id} a={a} car={p.carLabel(a)} da={da} />)}</ul>
                : <p className="text-sm text-muted-foreground">{da ? 'Ingen opgaver i dag.' : 'No tasks today.'}</p>}
            </div>
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{da ? 'Denne uge' : 'This week'}</h3>
              <ol className="grid grid-cols-5 gap-1.5">
                {p.week.map(d => (
                  <li key={d.date} className={cn('flex flex-col items-center rounded-xl border px-1 py-1.5 text-[11px]',
                    d.isToday ? 'border-primary bg-accent font-semibold text-primary-strong' : d.off ? 'border-success-soft bg-success-soft text-success-soft-foreground' : 'border-border bg-muted/40 text-muted-foreground')}>
                    <span>{d.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{d.off ? (da ? 'Fri' : 'Off') : d.count || '–'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
        {tab === 'tasks' && (p.upcoming.length
          ? <ul className="space-y-2">{p.upcoming.map(a => <AssignmentRow key={a.id} a={a} car={p.carLabel(a)} showDate da={da} />)}</ul>
          : <p className="text-sm text-muted-foreground">{da ? 'Ingen kommende opgaver de næste 14 dage.' : 'No tasks in the next 14 days.'}</p>)}
        {tab === 'absence' && (
          <ul className="space-y-2">
            {p.isSick && <li className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-semibold text-warning-soft-foreground">{da ? 'Meldt syg i dag' : 'Reported sick today'}</li>}
            {p.isOnTraining && <li className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-semibold text-warning-soft-foreground">{da ? 'På kursus i dag' : 'On training today'}</li>}
            {p.vacations.map(v => {
              const type = parseLeaveReason(v.reason || '').type ?? (da ? 'Fri' : 'Time off');
              return (
                <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{type}</span>
                    <span className="block text-xs text-muted-foreground">{v.start_date === v.end_date ? dateFmt(v.start_date) : `${dateFmt(v.start_date)} – ${dateFmt(v.end_date)}`}{v.request_type === 'partial_day' && v.start_time ? ` · ${t5(v.start_time)}–${t5(v.end_time)}` : ''}</span>
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', v.status === 'approved' ? TONE_CHIP.success : v.status === 'pending' ? TONE_CHIP.warning : TONE_CHIP.muted)}>
                    {v.status === 'approved' ? (da ? 'Godkendt' : 'Approved') : v.status === 'pending' ? (da ? 'Afventer' : 'Pending') : (da ? 'Afvist' : 'Rejected')}
                  </span>
                </li>
              );
            })}
            {!p.isSick && !p.isOnTraining && !p.vacations.length && <li className="text-sm text-muted-foreground">{da ? 'Intet fravær registreret.' : 'No absence registered.'}</li>}
          </ul>
        )}
        {tab === 'skills' && (
          <div className="space-y-4">
            {skills.length
              ? <ul className="flex flex-wrap gap-2">{skills.map(s => <li key={s.label} className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info-soft-foreground"><s.icon aria-hidden className="h-3.5 w-3.5" />{s.label}</li>)}</ul>
              : <p className="text-sm text-muted-foreground">{da ? 'Ingen certifikater registreret.' : 'No certificates registered.'}</p>}
            {p.canSeeContact && (
              <dl className="space-y-1.5 text-sm">
                {e.phone && <div className="flex items-center gap-2"><Phone aria-hidden className="h-4 w-4 text-muted-foreground" /><a className="text-primary-strong hover:underline" href={`tel:${e.phone.replace(/\s/g, '')}`}>{e.phone}</a></div>}
                {e.email && <div className="flex items-center gap-2"><Mail aria-hidden className="h-4 w-4 text-muted-foreground" /><a className="truncate text-primary-strong hover:underline" href={`mailto:${e.email}`}>{e.email}</a></div>}
                {e.notes && <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{e.notes}</p>}
              </dl>
            )}
          </div>
        )}
      </div>

      {(p.canCreate || p.isAdmin) && (
        <footer className="flex items-center gap-2 border-t border-border px-5 py-3">
          {p.canCreate && <Button size="sm" className="min-h-10 rounded-full" onClick={() => navigate('/planner?new=1')}><Plus className="h-4 w-4" />{da ? 'Planlæg opgave' : 'Plan task'}</Button>}
          {p.isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="min-h-10 rounded-full"><CalendarPlus className="h-4 w-4" />{da ? 'Registrér fravær' : 'Register absence'}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {p.onToggleSick && <DropdownMenuItem onSelect={p.onToggleSick}>{p.isSick ? <HeartPulse className="h-4 w-4" /> : <Thermometer className="h-4 w-4" />}{p.isSick ? (da ? 'Fjern sygemelding' : 'Remove sick leave') : (da ? 'Meld syg i dag' : 'Report sick today')}</DropdownMenuItem>}
                {p.onTraining && <DropdownMenuItem onSelect={p.onTraining}><GraduationCap className="h-4 w-4" />{da ? 'Meld på kursus' : 'Register training'}</DropdownMenuItem>}
                {p.onToggleLeave && <DropdownMenuItem onSelect={p.onToggleLeave}>{e.onLeave ? <UserCheck className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}{e.onLeave ? (da ? 'Marker som tilgængelig' : 'Mark available') : (da ? 'Marker som fraværende' : 'Mark on leave')}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {p.isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="ml-auto h-10 w-10 rounded-full" aria-label={da ? `Flere handlinger for ${e.name}` : `More actions for ${e.name}`}><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={p.onEdit}><Edit className="h-4 w-4" />{da ? 'Rediger' : 'Edit'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={p.onDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />{da ? 'Slet' : 'Delete'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </footer>
      )}
    </section>
  );
};

export default EmployeeDetailPanel;
