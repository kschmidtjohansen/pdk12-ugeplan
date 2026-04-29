import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';
import { useAssignmentConflicts } from '@/hooks/useAssignmentConflicts';
import { useTranslation } from '@/context/TranslationContext';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type PlannerFilterKey =
  | 'mine'
  | 'unpublished'
  | 'conflicts'
  | 'noResponsible'
  | 'noLocation';

const FILTER_PARAM = 'filters';

interface FilterChipsProps {
  weekAssignments: Assignment[];
}

/**
 * Sticky multi-select filter chips for the planner.
 * State is persisted in the URL (search param `filters=mine,unpublished,...`)
 * so it survives refresh and can be shared.
 *
 * The actual filtering is exposed via `usePlannerFilters` so PlannerPage
 * can apply it to its sortedWeekAssignments.
 */
const FilterChips: React.FC<FilterChipsProps> = ({ weekAssignments }) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasConflicts } = useAssignmentConflicts(weekAssignments);

  const activeFilters = useMemo(() => {
    const raw = searchParams.get(FILTER_PARAM) || '';
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as PlannerFilterKey[]
    );
  }, [searchParams]);

  const setFilters = useCallback(
    (next: Set<PlannerFilterKey>) => {
      const params = new URLSearchParams(searchParams);
      if (next.size === 0) {
        params.delete(FILTER_PARAM);
      } else {
        params.set(FILTER_PARAM, Array.from(next).join(','));
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const toggle = useCallback(
    (key: PlannerFilterKey) => {
      const next = new Set(activeFilters);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      setFilters(next);
    },
    [activeFilters, setFilters]
  );

  const clearAll = useCallback(() => setFilters(new Set()), [setFilters]);

  // Pre-compute counts so chips can show "Mine (3)" etc.
  const counts = useMemo(() => {
    const userId = user?.id;
    let mine = 0;
    let unpublished = 0;
    let conflicts = 0;
    let noResponsible = 0;
    let noLocation = 0;

    for (const a of weekAssignments) {
      if (
        userId &&
        (a.responsibleUserId === userId ||
          (a.employees || []).includes(userId))
      ) {
        mine += 1;
      }
      if (!a.published) unpublished += 1;
      if (hasConflicts(a.id)) conflicts += 1;
      if (!a.responsibleUserId) noResponsible += 1;
      if (!a.location || !a.location.trim()) noLocation += 1;
    }

    return { mine, unpublished, conflicts, noResponsible, noLocation };
  }, [weekAssignments, user?.id, hasConflicts]);

  const chips: Array<{
    key: PlannerFilterKey;
    label: string;
    tooltip: string;
    count: number;
    activeClass: string;
  }> = [
    {
      key: 'mine',
      label: currentLanguage === 'da' ? 'Mine opgaver' : 'My tasks',
      tooltip: currentLanguage === 'da'
        ? 'Vis kun opgaver hvor du er ansvarlig eller tildelt.'
        : 'Show only tasks where you are responsible or assigned.',
      count: counts.mine,
      activeClass: 'bg-primary/15 text-primary border-primary/30',
    },
    {
      key: 'unpublished',
      label: currentLanguage === 'da' ? 'Ikke aftalt' : 'Drafts',
      tooltip: currentLanguage === 'da'
        ? 'Vis kun kladder, der endnu ikke er publiceret til medarbejderne.'
        : 'Show only drafts not yet published to employees.',
      count: counts.unpublished,
      activeClass:
        'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800',
    },
    {
      key: 'conflicts',
      label: currentLanguage === 'da' ? 'Med konflikter' : 'Conflicts',
      tooltip: currentLanguage === 'da'
        ? 'Vis opgaver med dobbeltbookede biler eller medarbejdere.'
        : 'Show tasks with double-booked cars or employees.',
      count: counts.conflicts,
      activeClass:
        'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800',
    },
    {
      key: 'noResponsible',
      label:
        currentLanguage === 'da' ? 'Mangler ansvarlig' : 'No responsible',
      tooltip: currentLanguage === 'da'
        ? 'Vis opgaver uden tildelt skadeleder/ansvarlig.'
        : 'Show tasks without an assigned case manager.',
      count: counts.noResponsible,
      activeClass:
        'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-800',
    },
    {
      key: 'noLocation',
      label: currentLanguage === 'da' ? 'Mangler adresse' : 'No address',
      tooltip: currentLanguage === 'da'
        ? 'Vis opgaver hvor lokationen ikke er udfyldt.'
        : 'Show tasks where the location is missing.',
      count: counts.noLocation,
      activeClass:
        'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-800',
    },
  ];

  const hasActive = activeFilters.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => {
        const isActive = activeFilters.has(c.key);
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              'hover:bg-muted/60',
              isActive
                ? c.activeClass
                : 'border-border bg-background text-muted-foreground'
            )}
            aria-pressed={isActive}
          >
            <span>{c.label}</span>
            {c.count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 text-[10px] leading-4 min-w-[18px]',
                  isActive ? 'bg-background/60' : 'bg-muted'
                )}
              >
                {c.count}
              </span>
            )}
          </button>
        );
      })}
      {hasActive && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60"
        >
          <X className="h-3 w-3" />
          {currentLanguage === 'da' ? 'Nulstil' : 'Clear'}
        </button>
      )}
    </div>
  );
};

/**
 * Pure filter function that mirrors the chip logic.
 * Exported so PlannerPage can apply it before passing data to PlannerContent.
 */
export const applyPlannerFilters = (
  assignments: Assignment[],
  activeFilters: Set<PlannerFilterKey>,
  userId: string | undefined,
  hasConflicts: (id: string) => boolean
): Assignment[] => {
  if (activeFilters.size === 0) return assignments;
  return assignments.filter((a) => {
    if (activeFilters.has('mine')) {
      const isMine =
        !!userId &&
        (a.responsibleUserId === userId ||
          (a.employees || []).includes(userId));
      if (!isMine) return false;
    }
    if (activeFilters.has('unpublished') && a.published) return false;
    if (activeFilters.has('conflicts') && !hasConflicts(a.id)) return false;
    if (activeFilters.has('noResponsible') && a.responsibleUserId) return false;
    if (
      activeFilters.has('noLocation') &&
      a.location &&
      a.location.trim().length > 0
    )
      return false;
    return true;
  });
};

/**
 * Read active filters from the URL (used in PlannerPage to apply filtering).
 */
export const useActivePlannerFilters = (): Set<PlannerFilterKey> => {
  const [searchParams] = useSearchParams();
  return useMemo(() => {
    const raw = searchParams.get(FILTER_PARAM) || '';
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as PlannerFilterKey[]
    );
  }, [searchParams]);
};

export default FilterChips;
