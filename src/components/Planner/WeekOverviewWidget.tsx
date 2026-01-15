import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { format, parseISO, isSameDay, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

interface WeekOverviewWidgetProps {
  weekDates: string[];
  weekAssignments: Assignment[];
  onDayClick: (date: string, index: number) => void;
  currentVisibleIndex: number;
  selectedWeek: number;
}

const WeekOverviewWidget: React.FC<WeekOverviewWidgetProps> = ({
  weekDates,
  weekAssignments,
  onDayClick,
  currentVisibleIndex,
  selectedWeek
}) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : undefined;

  // Get assignments count per day
  const assignmentsPerDay = useMemo(() => {
    const counts: Record<string, number> = {};
    weekDates.forEach(date => {
      counts[date] = weekAssignments.filter(a => a.date === date).length;
    });
    return counts;
  }, [weekDates, weekAssignments]);

  // Check if a date is today
  const isToday = (dateStr: string) => {
    return isSameDay(parseISO(dateStr), new Date());
  };

  // Check if a date is in the past
  const isPast = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Card className="mb-4 border-primary/20">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {t('planner.weekOverview')} - {t('planner.week')} {selectedWeek}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((dateStr, index) => {
            const count = assignmentsPerDay[dateStr] || 0;
            const isCurrentDay = isToday(dateStr);
            const isPastDay = isPast(dateStr);
            const isSelected = index === currentVisibleIndex;

            return (
              <button
                key={dateStr}
                onClick={() => onDayClick(dateStr, index)}
                className={cn(
                  "p-2 rounded-lg text-center transition-all",
                  "hover:bg-primary/10 cursor-pointer border",
                  isCurrentDay && "bg-primary/15 border-primary ring-1 ring-primary",
                  isSelected && !isCurrentDay && "bg-accent border-primary/50",
                  isPastDay && !isCurrentDay && "opacity-60",
                  !isCurrentDay && !isSelected && "border-transparent hover:border-border"
                )}
              >
                {/* Day name */}
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  {format(parseISO(dateStr), 'EEE', { locale }).slice(0, 2)}
                </div>
                
                {/* Date number */}
                <div className={cn(
                  "text-lg font-bold",
                  isCurrentDay && "text-primary",
                  isSelected && !isCurrentDay && "text-foreground"
                )}>
                  {format(parseISO(dateStr), 'd')}
                </div>
                
                {/* Assignment count */}
                <div className={cn(
                  "text-xs font-medium mt-0.5 px-1.5 py-0.5 rounded-full mx-auto inline-block min-w-[2rem]",
                  count > 0 
                    ? "bg-primary/20 text-primary" 
                    : "text-muted-foreground bg-muted/50"
                )}>
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekOverviewWidget;
