import React, { useMemo } from 'react';
import { Plane, Clock } from 'lucide-react';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DayAbsenceRowProps {
  /** ISO date string (yyyy-MM-dd) for the day to render absences for */
  dateKey: string;
}

/**
 * DayAbsenceRow — Step 2 (B)
 * Shows approved vacations / absences for a given day inside DaySection,
 * so planners immediately see who is unavailable when assigning tasks.
 *
 * Frontend-only: uses existing `useVacations` data and respects current
 * department isolation through the underlying hook.
 */
const DayAbsenceRow: React.FC<DayAbsenceRowProps> = ({ dateKey }) => {
  const { vacations } = useVacations();
  const { employees } = useEmployees();

  const dayVacations = useMemo(() => {
    if (!Array.isArray(vacations)) return [];
    return vacations.filter((v) => {
      if (v.status !== 'approved') return false;
      // String compare yyyy-MM-dd avoids UTC timezone shifts (per project memory).
      return dateKey >= v.start_date && dateKey <= v.end_date;
    });
  }, [vacations, dateKey]);

  if (dayVacations.length === 0) return null;

  const resolveName = (userId: string, fallbackName?: string) => {
    if (fallbackName) return fallbackName;
    return employees.find((e) => e.id === userId)?.name || 'Ukendt';
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50/70 px-2.5 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/30"
        role="list"
        aria-label="Fravær denne dag"
      >
        <span className="icon-bubble icon-bubble-sm bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200" aria-hidden>
          <Plane className="h-3 w-3" />
        </span>
        <span className="text-[11px] font-medium text-amber-900 dark:text-amber-100">
          Fravær:
        </span>
        {dayVacations.map((v) => {
          const name = resolveName(v.user_id, v.user?.name);
          // Strip seconds: "08:00:00" → "08:00"
          const fmt = (t?: string) => (t ? t.slice(0, 5) : '');
          const isPartial = v.request_type === 'partial_day' && v.start_time && v.end_time;
          const label = isPartial ? `${name} (${fmt(v.start_time)}–${fmt(v.end_time)})` : name;
          return (
            <Tooltip key={v.id}>
              <TooltipTrigger asChild>
                <span
                  role="listitem"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-100"
                >
                  {isPartial && <Clock className="h-2.5 w-2.5" />}
                  {label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{name}</div>
                <div className="text-muted-foreground">
                  {v.reason || (isPartial ? 'Fravær (del af dag)' : 'Fravær (hel dag)')}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default DayAbsenceRow;
