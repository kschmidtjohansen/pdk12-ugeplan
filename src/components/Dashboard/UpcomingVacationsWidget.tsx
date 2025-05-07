
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';
import { CalendarClock, User } from 'lucide-react';
import { format } from 'date-fns';
import { da, enGB } from 'date-fns/locale';

interface UpcomingVacationsWidgetProps {
  vacations: Vacation[];
}

const UpcomingVacationsWidget: React.FC<UpcomingVacationsWidgetProps> = ({
  vacations
}) => {
  const {
    t,
    currentLanguage
  } = useTranslation();

  // Determine locale object based on current language
  const dateLocale = currentLanguage === 'da' ? da : enGB;

  // Sort vacations by start date and get only approved upcoming ones
  const upcomingVacations = vacations.filter(vacation => 
    vacation.status === 'approved' && new Date(vacation.startDate) >= new Date()
  ).sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  ).slice(0, 3); // Only show max 3 upcoming vacations

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {t('dashboard.upcomingVacations')}
        </CardTitle>
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {upcomingVacations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('dashboard.noUpcomingVacations')}
          </p>
        ) : (
          <div className="space-y-4">
            {upcomingVacations.map(vacation => (
              <div key={vacation.id} className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-polygon-light flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-polygon-blue" />
                </div>
                <div>
                  <p className="text-sm font-medium">{vacation.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(vacation.startDate), 'PPP', { locale: dateLocale })} - {format(new Date(vacation.endDate), 'PPP', { locale: dateLocale })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingVacationsWidget;
