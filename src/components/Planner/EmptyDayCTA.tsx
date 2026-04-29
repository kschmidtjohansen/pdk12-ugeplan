import React from 'react';
import { Plus, Copy, CalendarX2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

interface EmptyDayCTAProps {
  dateKey: string;
  /** Number of assignments on the previous day (for showing/disabling the copy button) */
  yesterdayCount: number;
  canEdit: boolean;
  onCreateAssignment: (date: string) => void;
  onCopyFromYesterday: (date: string) => void;
}

/**
 * EmptyDayCTA — Step 5 (E)
 * Replaces the boring "nothing planned" placeholder with action-oriented CTAs.
 * Visible only inside expanded DaySection when there are zero assignments AND user has canEdit.
 */
const EmptyDayCTA: React.FC<EmptyDayCTAProps> = ({
  dateKey,
  yesterdayCount,
  canEdit,
  onCreateAssignment,
  onCopyFromYesterday,
}) => {
  const { currentLanguage } = useTranslation();
  const isDa = currentLanguage === 'da';

  if (!canEdit) {
    return (
      <div className="py-6 px-4 rounded-lg text-center text-muted-foreground bg-slate-50 dark:bg-slate-800/50">
        <CalendarX2 className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
        <p>{isDa ? 'Ingen opgaver' : 'No tasks'}</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 rounded-lg text-center bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
      <CalendarX2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
        {isDa ? 'Ingen opgaver' : 'No tasks'}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {isDa
          ? 'Tilføj en ny opgave eller kopiér gårsdagens plan.'
          : 'Add a new task or copy yesterday\'s plan.'}
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="brand"
          onClick={() => onCreateAssignment(dateKey)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isDa ? 'Tilføj opgave' : 'Add task'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={yesterdayCount === 0}
          onClick={() => onCopyFromYesterday(dateKey)}
          title={
            yesterdayCount === 0
              ? isDa
                ? 'Der er ingen opgaver i går at kopiere'
                : 'No tasks yesterday to copy'
              : undefined
          }
        >
          <Copy className="h-4 w-4 mr-1" />
          {isDa
            ? `Kopiér fra i går${yesterdayCount > 0 ? ` (${yesterdayCount})` : ''}`
            : `Copy from yesterday${yesterdayCount > 0 ? ` (${yesterdayCount})` : ''}`}
        </Button>
      </div>
    </div>
  );
};

export default EmptyDayCTA;
