import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import type { Assignment } from '@/types/assignment';
import type { Vacation } from '@/types/vacation';

/**
 * Copy all of yesterday's assignments to the given date as drafts.
 * Employees with approved vacation overlapping the new date are left off.
 */
export function useCopyDayFromYesterday(
  assignments: Assignment[],
  vacations: Vacation[] | undefined,
  createAssignment: (data: Partial<Assignment>) => Promise<unknown>,
) {
  const { toast } = useToast();
  const { currentLanguage } = useTranslation();
  const handleCopyDayFromYesterday = useCallback(async (date: string) => {
    const target = new Date(date + 'T00:00:00');
    const prev = new Date(target);
    prev.setDate(prev.getDate() - 1);
    const yesterdayKey = prev.toISOString().slice(0, 10);
    const sourceAssignments = assignments.filter(a => a.date === yesterdayKey);

    if (sourceAssignments.length === 0) {
      toast({
        title: currentLanguage === 'da' ? 'Ingen opgaver i går' : 'No tasks yesterday',
        description: currentLanguage === 'da'
          ? 'Der er ingen opgaver fra forrige dag at kopiere.'
          : 'There are no tasks from the previous day to copy.',
      });
      return;
    }

    // Pre-compute employees on approved vacation for the target date
    const absentEmployeeIds = new Set<string>(
      (vacations || [])
        .filter(v => v.status === 'approved' && date >= v.start_date && date <= v.end_date)
        .map(v => v.user_id)
    );

    let copied = 0;
    let skippedEmployees = 0;
    for (const src of sourceAssignments) {
      const employees = (src.employees || []).filter(eid => {
        if (absentEmployeeIds.has(eid)) {
          skippedEmployees++;
          return false;
        }
        return true;
      });

      try {
        await createAssignment({
          title: src.title,
          description: src.description,
          date,
          fromTime: src.fromTime,
          toTime: src.toTime,
          location: src.location,
          type: src.type,
          case_number: src.case_number,
          responsibleUserId: src.responsibleUserId,
          car: typeof src.car === 'string' ? src.car : src.car?.id,
          employees,
          published: false,
        } as Partial<Assignment>);
        copied++;
      } catch (err) {
        if (import.meta.env.DEV) console.error('[CopyDay] failed for', src.id, err);
      }
    }

    toast({
      title: currentLanguage === 'da'
        ? `${copied} opgave${copied === 1 ? '' : 'r'} kopieret som kladde`
        : `${copied} task${copied === 1 ? '' : 's'} copied as draft`,
      description: skippedEmployees > 0
        ? (currentLanguage === 'da'
            ? `${skippedEmployees} medarbejder-tildeling${skippedEmployees === 1 ? '' : 'er'} blev udeladt pga. fravær.`
            : `${skippedEmployees} employee assignment${skippedEmployees === 1 ? '' : 's'} were skipped due to absence.`)
        : undefined,
    });
  }, [assignments, vacations, createAssignment, toast, currentLanguage]);
  return handleCopyDayFromYesterday;
}
