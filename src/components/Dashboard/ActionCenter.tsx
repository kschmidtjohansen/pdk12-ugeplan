import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, getISOWeek, getISOWeekYear, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { AlertTriangle, ArrowLeftRight, CalendarClock, Sun, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignments } from '@/hooks/useAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { useDutySwapRequests } from '@/hooks/duty/useDutySwapRequests';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import { computeConflicts, getAssignmentEmployeeIds } from '@/utils/assignmentConflicts';
import { plannerOperationsLink } from '@/utils/plannerOperations';
import { visibleVacations } from '@/utils/moduleListFilters';
import { parseLeaveReason } from '@/components/Vacation/leaveType';
import VacationActionDialog from '@/components/Vacation/VacationActionDialog';
import type { Vacation } from '@/types/vacation';

type Tone = 'destructive' | 'warning' | 'info' | 'success';
const TOP: Record<Tone, string> = {
  destructive: 'before:bg-destructive', warning: 'before:bg-warning', info: 'before:bg-primary', success: 'before:bg-success',
};
const TILE: Record<Tone, string> = {
  destructive: 'bg-destructive-soft text-destructive-soft-foreground', warning: 'bg-warning-soft text-warning-soft-foreground',
  info: 'bg-info-soft text-info-soft-foreground', success: 'bg-success-soft text-success-soft-foreground',
};

interface Item { key: string; tone: Tone; icon: typeof Sun; title: string; body: string; actions: React.ReactNode }

const t5 = (t?: string) => (t || '').slice(0, 5);

/** Lærredets "Kræver handling": dobbeltbookinger i dag, fridage der venter, vagtbytte til dig og opgaver uden hold. */
const ActionCenter: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const { user, isEffectiveAdmin, isEffectiveServicemedarbejder, canViewAllVacations, canManageVacations } = useAuth();
  const { assignments } = useAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars({ plannerScope: true });
  const { vacations, approveVacation, rejectVacation } = useVacations();
  const { incoming, refetch } = useDutySwapRequests();
  const { acceptSwapRequest, loading: swapBusy } = useDutyActions(refetch);
  const [action, setAction] = useState<{ v: Vacation; type: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');
  const week = getISOWeek(new Date()), year = getISOWeekYear(new Date());
  const locale = da ? daLocale : undefined;

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const todays = (assignments || []).filter(a => a.date === today);
    const conflicts = computeConflicts(todays, employees, cars || []);
    const seen = new Set<string>();
    for (const a of todays) {
      const c = (conflicts.byAssignment.get(a.id) ?? []).find(x => x.kind !== 'car');
      if (!c || seen.has(c.resourceId)) continue;
      seen.add(c.resourceId);
      out.push({
        key: `c-${c.resourceId}`, tone: 'destructive', icon: AlertTriangle,
        title: da ? `${c.resourceName.split(' ')[0]} er booket to steder` : `${c.resourceName.split(' ')[0]} is booked twice`,
        body: da ? `${a.title} og ${c.withTitle} overlapper kl. ${t5(c.withTime.from)}–${t5(c.withTime.to)}.` : `${a.title} and ${c.withTitle} overlap at ${t5(c.withTime.from)}–${t5(c.withTime.to)}.`,
        actions: <Button size="sm" className="rounded-full" onClick={() => navigate(plannerOperationsLink(week, year, 'conflicts'))}>{da ? 'Se i Ugeplan' : 'Open in planner'}</Button>,
      });
      if (seen.size >= 2) break;
    }
    if (canManageVacations) {
      const visible = visibleVacations(vacations, user?.id, isEffectiveAdmin, isEffectiveServicemedarbejder, canViewAllVacations);
      const pending = visible.filter(v => v.status === 'pending').sort((x, y) => x.start_date.localeCompare(y.start_date));
      const v = pending[0];
      if (v) {
        const others = new Set(visible.filter(o => o.user_id !== v.user_id && o.status === 'approved' && o.start_date <= v.end_date && o.end_date >= v.start_date).map(o => o.user_id)).size;
        const range = v.start_date === v.end_date ? format(parseISO(v.start_date), 'd. MMM', { locale }) : `${format(parseISO(v.start_date), 'd.', { locale })}–${format(parseISO(v.end_date), 'd. MMM', { locale })}`;
        const type = parseLeaveReason(v.reason || '').type ?? (da ? 'Fri' : 'Time off');
        out.push({
          key: `v-${v.id}`, tone: 'info', icon: Sun,
          title: da ? `${(v.user?.name || '').split(' ')[0]} søger fri ${range}` : `${(v.user?.name || '').split(' ')[0]} requests ${range} off`,
          body: `${type}.${others ? (da ? ` ${others} ${others === 1 ? 'anden' : 'andre'} har fri samme dage.` : ` ${others} other(s) off the same days.`) : ''}${pending.length > 1 ? (da ? ` ${pending.length - 1} mere venter.` : ` ${pending.length - 1} more waiting.`) : ''}`,
          actions: <>
            <Button size="sm" className="rounded-full" onClick={() => { setNote(''); setAction({ v, type: 'approve' }); }}>{da ? 'Godkend' : 'Approve'}</Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setNote(''); setAction({ v, type: 'reject' }); }}>{da ? 'Afvis' : 'Reject'}</Button>
          </>,
        });
      }
    }
    const swap = incoming.find(r => r.duty);
    if (swap?.duty) {
      out.push({
        key: `s-${swap.id}`, tone: 'warning', icon: ArrowLeftRight,
        title: da ? 'Bytte af vagt' : 'Duty swap',
        body: da ? `${swap.requester?.name ?? 'En kollega'} vil bytte ${format(parseISO(swap.duty.duty_date), 'EEEE d. MMM', { locale })} med dig.` : `${swap.requester?.name ?? 'A colleague'} wants to swap ${format(parseISO(swap.duty.duty_date), 'EEEE d MMM', { locale })} with you.`,
        actions: <>
          <Button size="sm" className="rounded-full" disabled={swapBusy} onClick={async () => {
            const r = await acceptSwapRequest(swap.id);
            if (['already_taken', 'expired', 'not_invited'].includes(r.status)) toast.info(da ? 'Vagten er allerede taget eller tilbuddet er udløbet.' : 'The duty is already taken or the offer expired.');
          }}>{da ? 'Godkend bytte' : 'Accept swap'}</Button>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => navigate('/duty')}>{da ? 'Se vagter' : 'See duties'}</Button>
        </>,
      });
    }
    const noCrew = (assignments || []).filter(a => a.date === today && getAssignmentEmployeeIds(a).length === 0);
    if (noCrew.length) {
      out.push({
        key: 'nocrew', tone: 'warning', icon: UsersRound,
        title: da ? `${noCrew.length} ${noCrew.length === 1 ? 'opgave mangler' : 'opgaver mangler'} hold i dag` : `${noCrew.length} task(s) need a crew today`,
        body: noCrew.slice(0, 2).map(a => `${t5(a.fromTime)} ${a.title}`).join(' · '),
        actions: <Button size="sm" className="rounded-full" onClick={() => navigate(plannerOperationsLink(week, year, 'unassigned'))}>{da ? 'Tildel i Ugeplan' : 'Assign in planner'}</Button>,
      });
    }
    return out;
  }, [assignments, employees, cars, vacations, incoming, today, da, locale, week, year, navigate, canManageVacations, user?.id, isEffectiveAdmin, isEffectiveServicemedarbejder, canViewAllVacations, acceptSwapRequest, swapBusy]);

  return (
    <section aria-labelledby="action-center-h" className="space-y-3">
      <h2 id="action-center-h" className="font-display text-lg font-bold text-foreground">{da ? 'Kræver handling' : 'Needs action'}</h2>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock aria-hidden className="h-4 w-4" />{da ? 'Intet venter på dig lige nu.' : 'Nothing is waiting for you right now.'}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 3).map(it => (
            <li key={it.key} className={cn('facet-card relative flex flex-col gap-2 overflow-hidden p-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:opacity-80', TOP[it.tone])}>
              <div className="flex items-center gap-2.5">
                <span aria-hidden className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', TILE[it.tone])}><it.icon className="h-4 w-4" /></span>
                <h3 className="text-sm font-semibold text-foreground">{it.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{it.body}</p>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-1">{it.actions}</div>
            </li>
          ))}
        </ul>
      )}
      <VacationActionDialog open={!!action} onOpenChange={o => { if (!o) setAction(null); }} vacation={action?.v ?? null} actionType={action?.type ?? 'approve'}
        note={note} setNote={setNote}
        onSubmit={() => { if (!action) return; if (action.type === 'approve') approveVacation(action.v, note); else rejectVacation(action.v, note); setAction(null); setNote(''); }} />
    </section>
  );
};

export default ActionCenter;
