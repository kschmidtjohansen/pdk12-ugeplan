import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { Shield, Car } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { Duty } from '@/types/duty';

interface DutyWeekWidgetProps {
  selectedWeek: number;
  selectedYear: number;
}

export const DutyWeekWidget = ({ selectedWeek, selectedYear }: DutyWeekWidgetProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;

  // Calculate week start and end dates
  const firstDayOfYear = new Date(selectedYear, 0, 1);
  const daysOffset = (selectedWeek - 1) * 7;
  const weekStart = startOfWeek(new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { duties, loading } = useDutyData(weekStart, weekEnd);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDutiesForDay = (date: Date): { skadeleder?: Duty; kørevagt?: Duty } => {
    const dayDuties = duties.filter(duty => 
      isSameDay(new Date(duty.duty_date), date)
    );

    return {
      skadeleder: dayDuties.find(d => d.duty_type === 'skadeleder_vagt'),
      kørevagt: dayDuties.find(d => d.duty_type === 'kørevagt'),
    };
  };

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t('duty.currentWeekDuty')}
        </h3>
        <div className="text-sm text-muted-foreground">
          {t('common.loading')}...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t('duty.currentWeekDuty')}
        </h3>
        <Link 
          to="/duty" 
          className="text-sm text-primary hover:underline"
        >
          {t('duty.viewAll')}
        </Link>
      </div>

      <div className="space-y-3">
        {weekDays.map(day => {
          const { skadeleder, kørevagt } = getDutiesForDay(day);
          const hasDuties = skadeleder || kørevagt;

          return (
            <div 
              key={day.toISOString()} 
              className="border-l-2 border-muted pl-3 py-2"
            >
              <div className="text-sm font-medium mb-2">
                {format(day, 'EEEE dd/MM', { locale })}
              </div>

              {!hasDuties ? (
                <div className="text-xs text-muted-foreground">
                  {t('duty.noDutyAssigned')}
                </div>
              ) : (
                <div className="space-y-2">
                  {skadeleder && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {t('duty.skadelederVagt')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={skadeleder.employee?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {skadeleder.employee?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {skadeleder.employee?.name?.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  )}

                  {kørevagt && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Car className="h-3 w-3" />
                        {t('duty.kørevagt')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={kørevagt.employee?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {kørevagt.employee?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {kørevagt.employee?.name?.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
