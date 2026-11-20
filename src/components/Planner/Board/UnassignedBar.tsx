import React from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Car as CarIcon } from 'lucide-react';
import { initials } from '@/lib/employeeToday';
import type { Unassigned } from '@/lib/plannerBoard';

interface Props { date: string; data: Unassigned; da: boolean; onShowAll?: () => void }

/** Lærredets glasbjælke under tavlen: hvem og hvilke biler der ikke er tildelt den valgte dag. */
const UnassignedBar: React.FC<Props> = ({ date, data, da, onShowAll }) => {
  const day = format(parseISO(date), 'EEEE', { locale: da ? daLocale : undefined });
  const shown = data.people.slice(0, 3);
  return (
    <div role="region" aria-label={da ? `Ikke tildelt ${day}` : `Unassigned ${day}`}
      className="facet-glass sticky bottom-[calc(84px+env(safe-area-inset-bottom))] z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-2.5 rounded-[20px] border border-border px-4 py-2.5 shadow-flydende lg:bottom-6">
      <span className="flex flex-col pr-1">
        <span className="text-xs text-muted-foreground">{da ? 'Ikke tildelt' : 'Unassigned'} {day}</span>
        <span className="font-display text-lg font-bold text-foreground">
          {data.people.length} {da ? (data.people.length === 1 ? 'person' : 'personer') : (data.people.length === 1 ? 'person' : 'people')} · {data.cars.length} {da ? (data.cars.length === 1 ? 'bil' : 'biler') : (data.cars.length === 1 ? 'car' : 'cars')}
        </span>
      </span>
      {shown.map(p => (
        <span key={p.employee.id} className="flex items-center gap-2 rounded-xl bg-muted px-2.5 py-1.5 text-[13px]">
          <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary-strong">{initials(p.employee.name)}</span>
          {p.employee.name}
          {p.partOff && <span className="font-semibold text-warning-soft-foreground">{p.partOff}</span>}
        </span>
      ))}
      {data.people.length > shown.length && <span className="text-xs font-semibold text-muted-foreground">+{data.people.length - shown.length}</span>}
      {data.cars.length > 0 && (
        <span className="flex items-center gap-1.5 rounded-xl bg-muted px-2.5 py-1.5 font-mono text-[13px]">
          <CarIcon aria-hidden className="h-3.5 w-3.5" />{data.cars.slice(0, 3).join(' · ')}{data.cars.length > 3 ? ` +${data.cars.length - 3}` : ''}
        </span>
      )}
      {onShowAll && <button type="button" onClick={onShowAll} className="min-h-9 rounded-xl px-3 text-[13px] font-semibold text-primary-strong hover:bg-accent">{da ? 'Vis alle' : 'Show all'}</button>}
    </div>
  );
};

export default UnassignedBar;
