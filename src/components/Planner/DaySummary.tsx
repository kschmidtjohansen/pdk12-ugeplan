import React, { useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { useEmployees } from '@/hooks/useEmployees';
import { useAssignmentConflicts } from '@/hooks/useAssignmentConflicts';
import { CheckCircle2, FileEdit, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DaySummaryProps {
  dayAssignments: Assignment[];
  /** All assignments for the week — needed for accurate conflict detection */
  allAssignments?: Assignment[];
}

/**
 * DaySummary — Step 3 (C)
 * Shown inside the collapsed DaySection header so planners see at a glance:
 *   - published vs draft count
 *   - conflict count
 *   - up to 5 assigned employee initials (avatar stack)
 *
 * Frontend-only: derives everything from already-fetched data.
 */
const DaySummary: React.FC<DaySummaryProps> = ({ dayAssignments, allAssignments = [] }) => {
  const { employees } = useEmployees();
  const { getConflicts } = useAssignmentConflicts(allAssignments);

  const stats = useMemo(() => {
    const published = dayAssignments.filter((a) => a.published).length;
    const drafts = dayAssignments.length - published;
    const conflicts = dayAssignments.reduce(
      (sum, a) => sum + (getConflicts(a.id).length > 0 ? 1 : 0),
      0
    );

    // Collect unique employee names assigned this day
    const nameSet = new Set<string>();
    dayAssignments.forEach((a) => {
      a.assignedEmployees?.forEach((e) => {
        const name = typeof e === 'object' ? e.name : e;
        if (name) nameSet.add(name);
      });
      a.employees?.forEach((e: any) => {
        const name = typeof e === 'object' ? e?.name : e;
        if (name) nameSet.add(name);
      });
    });
    const names = Array.from(nameSet);
    return { published, drafts, conflicts, names };
  }, [dayAssignments, getConflicts]);

  if (dayAssignments.length === 0) return null;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');

  const visibleAvatars = stats.names.slice(0, 5);
  const overflow = Math.max(0, stats.names.length - visibleAvatars.length);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-2 ml-3 flex-wrap">
        {stats.published > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              'bg-emerald-50 text-emerald-700 border border-emerald-200',
              'dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60'
            )}
            title="Publicerede opgaver"
          >
            <CheckCircle2 className="h-3 w-3" />
            {stats.published}
          </span>
        )}
        {stats.drafts > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              'bg-amber-50 text-amber-800 border border-amber-200',
              'dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60'
            )}
            title="Kladder (ikke aftalt)"
          >
            <FileEdit className="h-3 w-3" />
            {stats.drafts}
          </span>
        )}
        {stats.conflicts > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              'bg-rose-50 text-rose-700 border border-rose-200',
              'dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/60'
            )}
            title="Opgaver med konflikter"
          >
            <AlertTriangle className="h-3 w-3" />
            {stats.conflicts}
          </span>
        )}

        {visibleAvatars.length > 0 && (
          <div className="flex -space-x-1.5 ml-1">
            {visibleAvatars.map((name) => (
              <Tooltip key={name}>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-primary/15 text-[9px] font-semibold text-primary dark:border-slate-900"
                    aria-label={name}
                  >
                    {initials(name)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {name}
                </TooltipContent>
              </Tooltip>
            ))}
            {overflow > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-muted px-1 text-[9px] font-semibold text-muted-foreground dark:border-slate-900">
                    +{overflow}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-xs">
                  <ul className="space-y-0.5">
                    {stats.names.slice(5).map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DaySummary;
