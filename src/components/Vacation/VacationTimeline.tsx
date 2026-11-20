import React, { useMemo } from 'react';
import { addWeeks, format, parseISO, startOfISOWeek, startOfMonth, addDays } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Vacation } from '@/types/vacation';
import { kindOf, weeksTouched, WEEKS, type Kind } from '@/lib/vacationTimeline';
import { initials } from '@/lib/employeeToday';

const CELL: Record<Kind, string> = {
  Ferie: 'bg-success',
  Feriefridag: 'bg-primary',
  Afspadsering: 'bg-muted-foreground/60',
  other: 'bg-muted-foreground/40',
  pending: 'facet-hatch-pending',
};

interface Props { vacations: Vacation[]; da: boolean; today?: Date }

/** Lærredets "Overblik": hvem har fri hvornår, uge for uge et halvt år frem, med type og afventende som skraveret. */
const VacationTimeline: React.FC<Props> = ({ vacations, da, today = new Date() }) => {
  const locale = da ? daLocale : undefined;
  const start = useMemo(() => startOfISOWeek(startOfMonth(today)), [today]);
  const rows = useMemo(() => {
    const byUser = new Map<string, { name: string; cells: (Kind | null)[]; titles: string[]; labels: string[] }>();
    vacations.filter(v => v.status !== 'rejected').forEach(v => {
      const name = v.user?.name || '–';
      const row = byUser.get(v.user_id) ?? { name, cells: Array(WEEKS).fill(null), titles: Array(WEEKS).fill(''), labels: [] };
      const k = kindOf(v);
      const label = `${k === 'pending' ? (da ? 'Afventer' : 'Pending') : k === 'other' ? (da ? 'Fri' : 'Off') : k} ${format(parseISO(v.start_date), 'd. MMM', { locale })} – ${format(parseISO(v.end_date), 'd. MMM', { locale })}`;
      const touched = weeksTouched(v, start);
      if (touched.length) row.labels.push(label);
      touched.forEach(i => {
        // approved absence wins over a pending request in the same week
        if (!row.cells[i] || row.cells[i] === 'pending') row.cells[i] = k;
        row.titles[i] = row.titles[i] ? `${row.titles[i]}\n${label}` : label;
      });
      byUser.set(v.user_id, row);
    });
    return [...byUser.values()].filter(r => r.cells.some(Boolean)).sort((a, b) => a.name.localeCompare(b.name, 'da'));
  }, [vacations, start, da, locale]);
  const months = useMemo(() => {
    const out: { label: string; at: number }[] = [];
    for (let i = 0; i < WEEKS; i++) {
      const d = addDays(addWeeks(start, i), 6);
      const label = format(d, 'MMM', { locale }).replace('.', '').toUpperCase();
      if (!out.length || out[out.length - 1].label !== label) out.push({ label, at: i });
    }
    return out;
  }, [start, locale]);
  const legend = [
    { cls: CELL.Ferie, label: 'Ferie' }, { cls: CELL.Feriefridag, label: 'Feriefridag' },
    { cls: CELL.Afspadsering, label: 'Afspadsering' }, { cls: CELL.pending, label: da ? 'Afventer godkendelse' : 'Pending approval' },
  ];

  return (
    <section className="facet-card p-5" aria-labelledby="vac-overview-h">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="vac-overview-h" className="font-display text-lg font-bold text-foreground">{da ? 'Overblik' : 'Overview'}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {legend.map(l => <li key={l.label} className="inline-flex items-center gap-1.5"><span aria-hidden className={cn('h-2.5 w-2.5 rounded-sm', l.cls)} />{l.label}</li>)}
        </ul>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{da ? 'Ingen fravær det næste halve år.' : 'No absence in the next six months.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[9rem_minmax(0,1fr)] items-end gap-3 pb-2">
              <span />
              <div className="relative h-4 text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
                {months.map(m => <span key={m.label + m.at} className="absolute" style={{ left: `${(m.at / WEEKS) * 100}%` }}>{m.label}</span>)}
              </div>
            </div>
            <ul className="space-y-2">
              {rows.map(r => (
                <li key={r.name} className="relative grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground">
                    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-primary-strong">{initials(r.name)}</span>
                    <span className="truncate">{r.name}</span>
                  </span>
                  <span className="sr-only">{r.labels.join('; ')}</span>
                  <span aria-hidden className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
                    {r.cells.map((c, i) => (
                      <span key={i} title={r.titles[i] || undefined} className={cn('h-4 rounded-[4px]', c ? CELL[c] : 'bg-muted')} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default VacationTimeline;
