
import React from 'react';

import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';
import { CalendarClock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

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


  // Get approved vacations that are current or upcoming
  const relevantVacations = vacations.filter(vacation => 
    vacation.status === 'approved' && new Date(vacation.end_date + 'T00:00:00') >= today
  ).sort((a, b) => 
    new Date(a.start_date + 'T00:00:00').getTime() - new Date(b.start_date + 'T00:00:00').getTime()
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
    <section className="rounded-lg border border-border border-l-[3px] border-l-warning-soft-foreground bg-warning-soft/40 p-4">
      <header className="flex items-start justify-between gap-3 border-b border-warning-soft-foreground/20 pb-3 mb-2">
        <h3 className="text-sm font-semibold">
          {t('dashboard.upcomingVacations')}
        </h3>
        <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
      </header>
      <div>
        {relevantVacations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-left py-2">
            {t('dashboard.noUpcomingVacations')}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {relevantVacations.map(vacation => {
              const isOngoing = hasVacationStarted(new Date(vacation.start_date + 'T00:00:00'));
              return (
                <div key={vacation.id} className="flex flex-col items-start gap-2 py-3">
                  <div className="min-w-0 w-full">
                    <div className="text-left">
                      <p className="text-sm font-semibold break-words">{vacation.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground text-left">
                        {formatDateRangeWithWeeks(
                          new Date(vacation.start_date + 'T00:00:00'),
                          new Date(vacation.end_date + 'T00:00:00'),
                          currentLanguage,
                          t('common.week')
                        )}
                      </p>
                    </div>
                  </div>
                  {isOngoing && (
                    <Badge variant="outline" className="border-transparent bg-success-soft text-success-soft-foreground whitespace-normal">
                      {calculateDaysRemaining(new Date(vacation.end_date + 'T00:00:00'))} {t("vacation.days")}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingVacationsWidget;
