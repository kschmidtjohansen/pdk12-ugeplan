import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { useProximitySearch } from '@/hooks/useProximitySearch';
import { Home, MapPin, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da as daLocale, enGB } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProximityPanelProps {
  postcode: string;
  employees: Employee[];
  weekAssignments: Assignment[];
  weekDates: { start: Date; end: Date; startStr: string; endStr: string };
}

const formatKm = (km: number) => (km < 10 ? km.toFixed(1) : Math.round(km).toString());

/**
 * Lookup list showing which employees are closest to a searched postcode and
 * when they are free during the displayed week. Read-only.
 */
const ProximityPanel: React.FC<ProximityPanelProps> = ({
  postcode,
  employees,
  weekAssignments,
  weekDates,
}) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? daLocale : enGB;

  const { results, isLoading, notFound, isValidPostcode } = useProximitySearch({
    postcode,
    employees,
    weekAssignments,
    weekDates,
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
        {results.slice(0, 25).map((r) => (
          <li key={r.employee.id} className={cn('px-3 py-2.5', !r.hasAvailableDay && 'opacity-60')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.employee.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {r.homeDistanceKm !== null
                      ? `${t('planner.filters.distanceHome')} ${formatKm(r.homeDistanceKm)} km`
                      : t('planner.filters.noCoordinates')}
                  </span>
                  {r.days.some((d) => d.assignmentDistanceKm !== null) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t('planner.filters.distanceAssignment')}{' '}
                      {formatKm(
                        Math.min(
                          ...r.days
                            .map((d) => d.assignmentDistanceKm)
                            .filter((d): d is number => d !== null)
                        )
                      )}{' '}
                      km
                    </span>
                  )}
                </div>
              </div>
              {r.bestDistanceKm !== null && (
                <span className="shrink-0 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                  {formatKm(r.bestDistanceKm)} km
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {r.days.map((d) => {
                const label = format(parseISO(d.date), 'EEEEEE', { locale });
                const state = d.absent
                  ? t('planner.filters.absentDay')
                  : d.assignmentCount === 0
                    ? t('planner.filters.freeAllDay')
                    : d.freeFrom
                      ? t('planner.filters.freeFrom', { time: d.freeFrom })
                      : '';
                return (
                  <span
                    key={d.date}
                    title={`${format(parseISO(d.date), 'PPP', { locale })} — ${state}`}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]',
                      d.absent
                        ? 'border-border bg-muted text-muted-foreground'
                        : d.assignmentCount === 0
                          ? 'border-success-soft bg-success-soft text-success-soft-foreground'
                          : 'border-warning-soft bg-warning-soft text-warning-soft-foreground'
                    )}
                  >
                    <span className="font-medium capitalize">{label}</span>
                    <span>{state}</span>
                  </span>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProximityPanel;
