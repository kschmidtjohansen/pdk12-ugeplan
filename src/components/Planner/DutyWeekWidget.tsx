import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary">
              {t('duty.currentWeekDuty')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            {t('common.loading')}...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary">
              {t('duty.currentWeekDuty')}
            </CardTitle>
          </div>
          <Link 
            to="/duty" 
            className="text-sm text-primary hover:underline transition-colors"
          >
            {t('duty.viewAll')}
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">
            {t('common.loading')}...
          </div>
        ) : duties.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t('duty.noDutySelected')}
          </div>
        ) : (
          weekDays.map(day => {
            const { skadeleder, kørevagt } = getDutiesForDay(day);
            const hasDuties = skadeleder || kørevagt;

            if (!hasDuties) return null;

            return (
              <div 
                key={day.toISOString()} 
                className="border-l-2 border-primary/30 pl-3 py-2"
              >
                <div className="text-sm font-medium mb-2">
                  {format(day, 'EEEE dd/MM', { locale })}
                </div>

                <div className="space-y-2">
                  {skadeleder && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {t('duty.skadelederVagt')}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {skadeleder.employee?.avatar_url && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={skadeleder.employee.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {skadeleder.employee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-xs">{skadeleder.employee?.name}</span>
                      </div>
                    </div>
                  )}

                  {kørevagt && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Car className="h-3 w-3" />
                        {t('duty.kørevagt')}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {kørevagt.employee?.avatar_url && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={kørevagt.employee.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {kørevagt.employee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-xs">{kørevagt.employee?.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
