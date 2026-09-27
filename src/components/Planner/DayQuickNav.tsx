import React, { useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { cn } from '@/lib/utils';

interface DayQuickNavProps {
  /** ISO date strings (yyyy-MM-dd) for the week, in order. */
  days: string[];
  weekAssignments: Assignment[];
  /** Currently focused/expanded day, if any. */
  activeDate?: string | null;
  onSelectDay: (date: string) => void;
}

const DAY_LABELS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

/**
 * Slim day strip above the week list: one chip per day with task count and a
 * dot for unpublished drafts. Clicking a day focuses it in the list below.
 */
const DayQuickNav: React.FC<DayQuickNavProps> = ({ days, weekAssignments, activeDate, onSelectDay }) => {
  const todayStr = useMemo(() => new Date().toLocaleDateString('sv-SE'), []);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; drafts: number }>();
    days.forEach((d) => map.set(d, { total: 0, drafts: 0 }));
    weekAssignments.forEach((a) => {
      const key = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      const entry = map.get(key);
      if (!entry) return;
      entry.total += 1;
      if (!a.published) entry.drafts += 1;
    });
    return map;
  }, [days, weekAssignments]);

  if (days.length === 0) return null;

  return (
    <div className="flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((date) => {
        const entry = stats.get(date) ?? { total: 0, drafts: 0 };
        const d = new Date(`${date}T00:00:00`);
        const isToday = date === todayStr;
        const isActive = date === activeDate;
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDay(date)}
            aria-pressed={isActive}
            className={cn(
              'flex min-w-[68px] flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 transition-colors',
              'border-border/60 bg-card hover:bg-muted/60',
              isToday && 'border-primary/40',
              isActive && 'bg-primary/10 border-primary text-primary'
            )}
          >
            <span className="text-[11px] font-medium leading-none">
              {DAY_LABELS[d.getDay()]} {d.getDate()}.
            </span>
            <span className="flex items-center gap-1 text-[11px] leading-none text-muted-foreground tabular-nums">
              {entry.total}
              {entry.drafts > 0 && <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-label="kladder" />}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(DayQuickNav);
