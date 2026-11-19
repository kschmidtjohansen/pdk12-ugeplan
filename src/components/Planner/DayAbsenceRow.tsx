import React, { useMemo } from 'react';
import { Plane, Clock } from 'lucide-react';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useSickForDateValue } from '@/hooks/useSickDays';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { approvedAbsencesOnDate, partialAbsencePeriod } from '@/utils/plannerAbsence';

interface DayAbsenceRowProps {
  /** ISO date string (yyyy-MM-dd) for the day to render absences for */
  dateKey: string;
}

/**
 * DayAbsenceRow — Step 2 (B)
 * Shows approved vacations / absences for a given day inside DaySection,
 * so planners immediately see who is unavailable when assigning tasks.
 *
 * Sick employees for that exact day are included as well, but always presented
 * as plain "absent" — the reason is never exposed here, for any role.
 */
const DayAbsenceRow: React.FC<DayAbsenceRowProps> = ({ dateKey }) => {
  const { vacations, loading: vacationsLoading } = useVacations();
  const { employees } = useEmployees();
  const { t } = useTranslation();
  const { sickIds, isLoading: sickLoading } = useSickForDateValue(dateKey);


  const dayVacations = useMemo(() => {
    if (!Array.isArray(vacations)) return [];
    return approvedAbsencesOnDate(vacations, dateKey);
  }, [vacations, dateKey]);

  const sickEmployees = useMemo(() => {
    if (!sickIds.size || !Array.isArray(employees)) return [];
    const onVacation = new Set(dayVacations.map((v) => v.user_id));
    return employees.filter((e) => sickIds.has(e.id) && !onVacation.has(e.id));
  }, [employees, sickIds, dayVacations]);

  // Reserve the row height while absence data is still loading, so the day's
  // assignments below don't shift down when it arrives (CLS).
  if (vacationsLoading || sickLoading) {
    return <div className="h-8" aria-hidden="true" />;
  }

  if (dayVacations.length === 0 && sickEmployees.length === 0) return null;

  const resolveName = (userId: string, fallbackName?: string) => {
    if (fallbackName) return fallbackName;
    return employees.find((e) => e.id === userId)?.name || 'Ukendt';
  };

  const absentLabel = t('planner.absentEmployees');


  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-warning/30 bg-warning-soft/70 px-2.5 py-1.5"
        role="list"
        aria-label={t('ui.absenceThisDay')}
      >
        <span className="icon-bubble icon-bubble-sm bg-warning-soft text-warning-soft-foreground" aria-hidden>
          <Plane className="h-3 w-3" />
        </span>
        <span className="text-[11px] font-medium text-warning-soft-foreground">
          {t('ui.absence')}:
        </span>
        {dayVacations.map((v) => {
          const name = resolveName(v.user_id, v.user?.name);
          const period = partialAbsencePeriod(v);
          const isPartial = Boolean(period);
          const label = period ? `${name} (${period})` : name;
          return (
            <Tooltip key={v.id}>
              <TooltipTrigger asChild>
                <span
                  role="listitem"
                  className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-card/70 px-2 py-0.5 text-[11px] font-medium text-warning-soft-foreground"
                >
                  {isPartial && <Clock className="h-2.5 w-2.5" />}
                  {label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{name}</div>
                <div className="text-muted-foreground">
                  {v.reason || (isPartial ? t('ui.absencePartDay') : t('ui.absenceFullDay'))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {sickEmployees.map((employee) => (
          <Tooltip key={`sick-${employee.id}`}>
            <TooltipTrigger asChild>
              <span
                role="listitem"
                className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-card/70 px-2 py-0.5 text-[11px] font-medium text-warning-soft-foreground"
              >
                {employee.name}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="font-medium">{employee.name}</div>
              <div className="text-muted-foreground">{absentLabel}</div>
            </TooltipContent>
          </Tooltip>
        ))}

      </div>
    </TooltipProvider>
  );
};

export default React.memo(DayAbsenceRow);
