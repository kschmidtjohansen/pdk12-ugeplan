
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useVacations } from '@/hooks/useVacations';
import { format, differenceInDays, isBefore } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';

const UpcomingVacations: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { vacations } = useVacations();
  const today = new Date();
  
  // Get upcoming vacations (starting in the next 30 days or currently active)
  const upcomingVacations = vacations
    .filter(vacation => 
      vacation.status === 'approved' && 
      (
        // Current vacations
        (isBefore(new Date(vacation.startDate), today) && 
         isBefore(today, new Date(vacation.endDate))) ||
        // Upcoming vacations in the next 30 days
        (isBefore(today, new Date(vacation.startDate)) && 
         differenceInDays(new Date(vacation.startDate), today) <= 30)
      )
    )
    .sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 5); // Limit to 5 entries
  
  const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
  
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('dashboard.upcomingVacations')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingVacations.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {t('vacation.noRequests')}
          </p>
        ) : (
          <div className="space-y-4">
            {upcomingVacations.map((vacation) => {
              const isActive = isBefore(new Date(vacation.startDate), today);
              
              return (
                <div key={vacation.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{vacation.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(vacation.startDate), dateFormat)} - {format(new Date(vacation.endDate), dateFormat)}
                    </p>
                  </div>
                  <StatusBadge variant={isActive ? 'success' : 'info'}>
                    {isActive 
                      ? t('dashboard.currentlyOnLeave') 
                      : t('dashboard.startingSoon')}
                  </StatusBadge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingVacations;
