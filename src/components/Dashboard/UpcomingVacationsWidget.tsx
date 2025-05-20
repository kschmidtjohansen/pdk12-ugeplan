
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';
import { CalendarClock, User } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { da, enGB } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { formatDateRangeWithWeeks } from '@/utils/dateUtils';

interface UpcomingVacationsWidgetProps {
  vacations: Vacation[];
}

const UpcomingVacationsWidget: React.FC<UpcomingVacationsWidgetProps> = ({
  vacations
}) => {
  const { t, currentLanguage } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine locale object based on current language
  const dateLocale = currentLanguage === 'da' ? da : enGB;

  // Get approved vacations that are current or upcoming
  const relevantVacations = vacations.filter(vacation => 
    vacation.status === 'approved' && new Date(vacation.endDate) >= today
  ).sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  ).slice(0, 5); // Show max 5 vacations

  // Calculate days remaining for current vacations
  const calculateDaysRemaining = (endDate: Date): number => {
    return differenceInDays(new Date(endDate), today) + 1;
  };

  // Check if a vacation has already started
  const hasVacationStarted = (startDate: Date): boolean => {
    return new Date(startDate) <= today;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {t('dashboard.upcomingVacations')}
        </CardTitle>
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {relevantVacations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('dashboard.noUpcomingVacations')}
          </p>
        ) : (
          <div className="space-y-4">
            {relevantVacations.map(vacation => {
              const isOngoing = hasVacationStarted(vacation.startDate);
              return (
                <div key={vacation.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-polygon-light flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-polygon-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{vacation.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRangeWithWeeks(
                          new Date(vacation.startDate),
                          new Date(vacation.endDate),
                          currentLanguage,
                          t('common.week')
                        )}
                      </p>
                    </div>
                  </div>
                  {isOngoing && (
                    <Badge variant="outline" className="bg-green-50 whitespace-nowrap">
                      {calculateDaysRemaining(vacation.endDate)} {t("vacation.days")}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingVacationsWidget;
