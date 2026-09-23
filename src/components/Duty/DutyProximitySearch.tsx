import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyProximitySearch } from '@/hooks/duty/useDutyProximitySearch';
import { formatKm, formatMinutes } from '@/utils/travelTime';
import { Phone, Home, Loader2, MapPin, X, ChevronDown } from 'lucide-react';
import type { Duty } from '@/types/duty';
import type { Employee } from '@/types/employee';

interface DutyProximitySearchProps {
  /** Employees who are, or have been, on the duty plan */
  rosterEmployees: Employee[];
  /** All loaded duties — used to badge who is on duty today */
  duties: Duty[];
  todayStr: string;
}

const STORAGE_KEY = 'duty.proximity.open';

/**
 * Search a damage postcode and see which duty personnel live closest to it.
 * Distances are measured from each person's home address.
 */
const DutyProximitySearch: React.FC<DutyProximitySearchProps> = ({
  rosterEmployees,
  duties,
  todayStr,
}) => {
  const { t } = useTranslation();
  const [postcode, setPostcode] = useState('');
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== '0'; } catch { return true; }
  });

  const toggleOpen = () => {
    setOpen((prev) => {
      try { localStorage.setItem(STORAGE_KEY, prev ? '0' : '1'); } catch { /* ignore */ }
      return !prev;
    });
  };

  const { results, isLoading, notFound, isValidPostcode } = useDutyProximitySearch({
    postcode,
    employees: rosterEmployees,
  });

  const onDutyToday = useMemo(() => {
    const map = new Map<string, string>();
    duties
      .filter((d) => d.duty_date === todayStr && d.employee_id)
      .forEach((d) => map.set(d.employee_id!, d.duty_type));
    return map;
  }, [duties, todayStr]);

  const trimmed = postcode.trim();

  return (
    <Card className="rounded-xl border-border/60 shadow-none p-4">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label={open ? t('duty.collapse') : t('duty.expand')}
        className="touch-target flex w-full items-center gap-2 text-left"
      >
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <h2 className="text-sm font-semibold text-foreground">{t('duty.proximityTitle')}</h2>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="pt-3 space-y-3">
      <p className="text-xs text-muted-foreground">{t('duty.proximityHint')}</p>

      <div className="flex items-center gap-2">
        <Input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder={t('duty.postcodePlaceholder')}
          aria-label={t('duty.proximityTitle')}
          className="max-w-[160px]"
        />
        {trimmed && (
          <Button
            variant="ghost"
            size="sm"
            className="touch-target"
            onClick={() => setPostcode('')}
            aria-label={t('duty.clearSearch')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {trimmed && !isValidPostcode && (
        <p className="text-xs text-muted-foreground">{t('duty.postcodeInvalid')}</p>
      )}

      {isValidPostcode && isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('duty.searching')}
        </div>
      )}

      {isValidPostcode && !isLoading && notFound && (
        <p className="text-xs text-muted-foreground">{t('duty.postcodeNotFound')}</p>
      )}

      {isValidPostcode && !isLoading && !notFound && results.length === 0 && (
        <p className="text-xs text-muted-foreground">{t('duty.noRosterEmployees')}</p>
      )}

      {isValidPostcode && !isLoading && results.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border max-h-[420px] overflow-y-auto">
          {results.slice(0, 25).map((r) => {
            const dutyType = onDutyToday.get(r.employee.id);
            return (
              <li key={r.employee.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.employee.name}</p>
                    {dutyType && (
                      <Badge className="bg-success-soft text-success-soft-foreground hover:bg-success-soft text-[11px] font-normal shrink-0">
                        {t('duty.onDutyToday')}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {r.distanceKm !== null
                        ? `${formatKm(r.distanceKm)} km · ${t('duty.approx')} ${formatMinutes(r.travelMin ?? 0)}`
                        : t('duty.noCoordinates')}
                    </span>
                    {r.employee.phone && <span className="truncate">{r.employee.phone}</span>}
                  </div>
                </div>
                {r.employee.phone && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="touch-target shrink-0"
                    aria-label={`${t('duty.call')} ${r.employee.name}`}
                  >
                    <a href={`tel:${r.employee.phone.replace(/\s/g, '')}`}>
                      <Phone className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">{t('duty.call')}</span>
                    </a>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(DutyProximitySearch);
