import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { useProximitySearch } from '@/hooks/useProximitySearch';
import { Home, MapPin, Loader2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da as daLocale, enGB } from 'date-fns/locale';
import { formatKm, formatMinutes } from '@/utils/travelTime';
import { cn } from '@/lib/utils';

interface ProximityPanelProps {
  postcode: string;
  employees: Employee[];
  weekAssignments: Assignment[];
  weekDates: { start: Date; end: Date; startStr: string; endStr: string };
  /** When true (Fugt sub-department), only fugttekniker employees are shown */
  onlyFugtteknikere?: boolean;
}

/**
 * Lookup list showing which employees are closest to a searched postcode, how
 * long the drive is estimated to take, and how much free time they have left
 * each day of the displayed week. Read-only.
 */
const ProximityPanel: React.FC<ProximityPanelProps> = ({
  postcode,
  employees,
  weekAssignments,
  weekDates,
  onlyFugtteknikere = false,
}) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? daLocale : enGB;

  const { results, isLoading, notFound, isValidPostcode } = useProximitySearch({
    postcode,
    employees,
    weekAssignments,
    weekDates,
    onlyFugtteknikere,
  });

  if (!postcode.trim()) return null;

  if (!isValidPostcode) {
    return (
      <p className="text-xs text-muted-foreground px-1">{t('planner.filters.postcodeInvalid')}</p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('planner.filters.searching')}
      </div>
    );
  }

  if (notFound) {
    return (
      <p className="text-xs text-muted-foreground px-1">{t('planner.filters.postcodeNotFound')}</p>
    );
  }

  if (results.length === 0) {
    return <p className="text-xs text-muted-foreground px-1">{t('planner.filters.noResults')}</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground">{t('planner.filters.proximityHint')}</p>
      </div>
      <ul className="divide-y divide-border max-h-[420px] overflow-y-auto">
        {results.slice(0, 25).map((r) => {
          const sourceLabel = (origin: 'assignment' | 'home' | null) =>
            origin === 'assignment'
              ? t('planner.filters.fromLastAssignment')
              : origin === 'home'
                ? t('planner.filters.fromHome')
                : '';
          return (
            <li
              key={r.employee.id}
              className={cn(
                'px-3 py-2.5',
                r.hasEnoughFreeDay
                  ? 'border-l-2 border-l-success-soft-foreground bg-success-soft/25'
                  : 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.employee.name}</p>
                    {r.hasEnoughFreeDay && (
                      <span className="shrink-0 rounded-md bg-success-soft text-success-soft-foreground px-1.5 py-0.5 text-[11px] font-medium">
                        {t('planner.filters.enoughTime')}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {r.bestDistanceKm !== null ? (
                      <span className="inline-flex items-center gap-1">
                        {r.bestSource === 'assignment' ? (
                          <MapPin className="h-3 w-3" />
                        ) : (
                          <Home className="h-3 w-3" />
                        )}
                        {sourceLabel(r.bestSource)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {t('planner.filters.noCoordinates')}
                      </span>
                    )}
                  </div>
                </div>
                {r.bestDistanceKm !== null && (
                  <span className="shrink-0 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold text-right">
                    {formatKm(r.bestDistanceKm)} km
                    {r.bestTravelMin !== null && (
                      <span className="block font-normal text-[11px]">
                        {t('planner.filters.travelApprox', { time: formatMinutes(r.bestTravelMin) })}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {r.days.map((d) => {
                  const label = format(parseISO(d.date), 'EEEEEE', { locale });
                  const time = d.absent
                    ? t('planner.filters.absentDay')
                    : d.assignmentCount === 0
                      ? t('planner.filters.freeAllDay', { duration: formatMinutes(d.freeMinutes) })
                      : d.hasEnoughFree
                        ? `${t('planner.filters.freeFrom', { time: d.freeFrom ?? d.dayEnd })} · ${formatMinutes(d.freeMinutes)}`
                        : t('planner.filters.busyDay');
                  return (
                    <span
                      key={d.date}
                      title={`${format(parseISO(d.date), 'PPP', { locale })} — ${time}`}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]',
                        d.absent || !d.hasEnoughFree
                          ? 'border-border bg-muted text-muted-foreground'
                          : d.assignmentCount === 0
                            ? 'border-success-soft bg-success-soft text-success-soft-foreground'
                            : 'border-warning-soft bg-warning-soft text-warning-soft-foreground'
                      )}
                    >
                      <span className="font-medium capitalize">{label}</span>
                      {!d.absent && d.hasEnoughFree && <Clock className="h-3 w-3" />}
                      <span>{time}</span>
                    </span>
                  );
                })}
              </div>
            </li>
          );
        })}

      </ul>
    </div>
  );
};

export default ProximityPanel;
