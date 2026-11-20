import React from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types/employee';
import { TONE_CHIP, TONE_RING, initials, type TodayStatus } from '@/lib/employeeToday';
import TempExpiryBadge from './TempExpiryBadge';

export interface EmployeeCardInfo {
  status: TodayStatus;
  /** "BIL 07" for the car of the current or next assignment today. */
  carLabel?: string;
}

interface Props {
  employees: Employee[];
  info: Map<string, EmployeeCardInfo>;
  selectedId: string | null;
  onSelect: (employee: Employee) => void;
}

/** Lærredets medarbejderkort: avatar, navn, stilling, dagens status og bil. Klik åbner detaljepanelet. */
const EmployeeCardGrid: React.FC<Props> = ({ employees, info, selectedId, onSelect }) => (
  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {employees.map(e => {
      const i = info.get(e.id);
      const selected = e.id === selectedId;
      return (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onSelect(e)}
            aria-pressed={selected}
            className={cn(
              'facet-card facet-lift flex h-full w-full flex-col gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected && 'ring-2 ring-primary',
            )}
          >
            <span className="flex items-center gap-3">
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-sm font-bold', TONE_RING[i?.status.tone ?? 'muted'], TONE_CHIP[i?.status.tone ?? 'muted'])}>
                {e.avatar_url ? <img src={e.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(e.name)}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-foreground">{e.name}</span>
                  <TempExpiryBadge employee={e} />
                </span>
                <span className="block truncate text-xs text-muted-foreground">{e.jobTitle || ' '}</span>
              </span>
            </span>
            <span className="mt-auto flex min-w-0 flex-col items-start gap-1.5">
              {i && <span className={cn('max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-semibold', TONE_CHIP[i.status.tone])}>{i.status.label}</span>}
              <span className="self-end font-mono text-[11px] font-semibold text-muted-foreground">
                {i?.carLabel ? <span className="inline-flex items-center gap-1"><Car aria-hidden className="h-3.5 w-3.5" />{i.carLabel}</span> : <span aria-hidden>–</span>}
              </span>
            </span>
          </button>
        </li>
      );
    })}
  </ul>
);

export default EmployeeCardGrid;
