
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface WeeklyCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  assignments: Assignment[];
  weekDates: Date[];
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  onDateSelect,
  assignments,
  weekDates
}) => {
  const { t } = useTranslation();

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments.filter(assignment => assignment.date === dateStr);
  };

  const isSelected = (date: Date) => {
    return selectedDate === format(date, 'yyyy-MM-dd');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {t('dashboard.weeklyCalendar')}
        </CardTitle>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDates.map((date) => {
            const dayAssignments = getAssignmentsForDate(date);
            const selected = isSelected(date);
            
            return (
              <Button
                key={date.toISOString()}
                variant={selected ? "default" : "ghost"}
                size="sm"
                className="h-auto p-2 flex flex-col items-center"
                onClick={() => onDateSelect(format(date, 'yyyy-MM-dd'))}
              >
                <span className="text-xs font-medium">
                  {format(date, 'EEE')}
                </span>
                <span className="text-sm">
                  {format(date, 'd')}
                </span>
                {dayAssignments.length > 0 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {dayAssignments.length}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyCalendar;
