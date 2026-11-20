import React from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import type { Vacation } from '@/types/vacation';
import { parseLeaveReason } from './leaveType';
import { initials } from '@/lib/employeeToday';

interface Props {
  pending: Vacation[];
  /** All visible requests, to count others off in the same period. */
  all: Vacation[];
  onApprove: (v: Vacation) => void;
  onReject: (v: Vacation) => void;
  da: boolean;
}

const overlaps = (a: Vacation, b: Vacation) => a.start_date <= b.end_date && a.end_date >= b.start_date;

/** Lærredets "Afventer godkendelse": én række pr. anmodning med Godkend og Afvis, og hvor mange andre der har fri samtidig. */
const PendingApprovals: React.FC<Props> = ({ pending, all, onApprove, onReject, da }) => {
  const locale = da ? daLocale : undefined;
  const range = (v: Vacation) => {
    const s = parseISO(v.start_date), e = parseISO(v.end_date);
    const time = v.request_type === 'partial_day' && v.start_time ? ` ${v.start_time.slice(0, 5)}–${(v.end_time || '').slice(0, 5)}` : '';
    if (v.start_date === v.end_date) return format(s, 'd. MMM', { locale }) + time;
    return s.getMonth() === e.getMonth() ? `${format(s, 'd.', { locale })}–${format(e, 'd. MMMM', { locale })}` : `${format(s, 'd. MMM', { locale })}–${format(e, 'd. MMM', { locale })}`;
  };
  return (
    <section className="facet-card p-5" aria-labelledby="vac-pending-h">
      <h2 id="vac-pending-h" className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground">
        {da ? 'Afventer godkendelse' : 'Awaiting approval'}
        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold tabular-nums text-warning-soft-foreground">{pending.length}</span>
      </h2>
      {pending.length === 0 ? <p className="text-sm text-muted-foreground">{da ? 'Ingen anmodninger venter.' : 'Nothing waiting.'}</p> : (
        <ul className="divide-y divide-border">
          {pending.map(v => {
            const type = parseLeaveReason(v.reason || '').type ?? (da ? 'Fri' : 'Time off');
            const others = new Set(all.filter(o => o.id !== v.id && o.user_id !== v.user_id && o.status !== 'rejected' && overlaps(o, v)).map(o => o.user_id)).size;
            const name = v.user?.name || '–';
            return (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-3">
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary-strong">{initials(name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{type} · {range(v)}</span>
                  {others > 0 && <span className="block text-xs font-semibold text-warning-soft-foreground">{da ? `${others} ${others === 1 ? 'anden' : 'andre'} har fri samtidig` : `${others} other${others === 1 ? '' : 's'} off at the same time`}</span>}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <Button size="sm" className="min-h-9 rounded-full" onClick={() => onApprove(v)} aria-label={`${da ? 'Godkend' : 'Approve'} ${name}`}>{da ? 'Godkend' : 'Approve'}</Button>
                  <Button size="sm" variant="ghost" className="min-h-9 rounded-full" onClick={() => onReject(v)} aria-label={`${da ? 'Afvis' : 'Reject'} ${name}`}>{da ? 'Afvis' : 'Reject'}</Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{da ? 'Typer: Ferie, Feriefridag og Afspadsering. Deldage vises med klokkeslæt.' : 'Types: Ferie, Feriefridag and Afspadsering. Part days show the time.'}</p>
    </section>
  );
};

export default PendingApprovals;
