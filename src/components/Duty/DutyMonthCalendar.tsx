import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { Duty } from '@/types/duty';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay
} from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DutyMonthCalendarProps {
  duties: Duty[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onDutyClick: (duty: Duty) => void;
  canManage: boolean;
}

export const DutyMonthCalendar = ({
  duties,
  month,
  onMonthChange,
  onDutyClick,
  canManage,
}: DutyMonthCalendarProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDutiesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return duties.filter(duty => duty.duty_date === dateStr);
  };

  const getDutyColor = (dutyType: string) => {
    if (dutyType === 'skadeleder_vagt') {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-100',
        hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/40'
      };
    }
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-300 dark:border-green-700',
      text: 'text-green-900 dark:text-green-100',
      hover: 'hover:bg-green-200 dark:hover:bg-green-800/40'
    };
  };

  const getDutyTypeName = (dutyType: string) => {
    return dutyType === 'skadeleder_vagt' 
      ? t('duty.skadelederVagt')
      : t('duty.kørevagt');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to extract initials from external entry notes
  const getExternalInitials = (notes: string | null | undefined): string => {
    if (!notes?.startsWith('EKSTERN:')) return '?';
    
    const match = notes.match(/\[([A-Z]{1,2})\]/);
    if (match) return match[1];
    
    const name = notes.split('\n')[0].replace('EKSTERN: ', '');
    return name.split(/\s+/).map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  // Helper to get display name from duty
  const getDisplayName = (duty: Duty): string => {
    if (duty.employee?.name) return duty.employee.name;
    if (duty.notes?.startsWith('EKSTERN:')) {
      return duty.notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim();
    }
    return 'Ukendt';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {format(month, 'MMMM yyyy', { locale })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange(new Date())}
            >
              {t('duty.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(subMonths(month, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(addMonths(month, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div
              key={i}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {currentLanguage === 'da' 
                ? ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'][i]
                : day
              }
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, i) => {
            const dayDuties = getDutiesForDate(day);
            const isCurrentMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] border rounded-lg p-2",
                  isCurrentMonth ? "bg-card" : "bg-muted/30",
                  isToday && "ring-2 ring-primary"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                    isToday && "text-primary font-bold"
                  )}
                >
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayDuties.map((duty) => {
                    const colors = getDutyColor(duty.duty_type);
                    const employeeName = getDisplayName(duty);
                    const initials = duty.employee?.name 
                      ? getInitials(employeeName) 
                      : getExternalInitials(duty.notes);
                    
                    return (
                      <button
                        key={duty.id}
                        onClick={() => canManage && onDutyClick(duty)}
                        disabled={!canManage}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded border text-xs transition-colors",
                          colors.bg,
                          colors.border,
                          colors.text,
                          canManage && colors.hover,
                          canManage ? "cursor-pointer" : "cursor-default"
                        )}
                        title={`${employeeName} - ${getDutyTypeName(duty.duty_type)}`}
                      >
                        <div className="font-medium truncate">
                          {initials}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
                          {duty.duty_type === 'skadeleder_vagt' ? 'SL' : 'KV'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></div>
            <span className="text-sm text-muted-foreground">
              {t('duty.skadelederVagt')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></div>
            <span className="text-sm text-muted-foreground">
              {t('duty.kørevagt')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
